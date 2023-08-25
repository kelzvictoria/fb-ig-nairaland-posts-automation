const axios = require("axios");
const WPAPI = require('wpapi');
const fs = require('fs');
const request = require('request');
const posted_content_json = require("./posted_content.json");
const nairaland_users = require("./nairaland_users.json");
const FormData = require("form-data");
const { you_tube_channel, platforms, nairaland_forums } = require("./utils");
const { response } = require("express");
const { IgApiClient} = require('instagram-private-api');
const { login } = require("./nairaland-auth")

const { FB_PAGE_ID, FB_ACCESS_TOKEN, IG_USERNAME, IG_PASSWORD } = process.env;

const IG = new IgApiClient()

const wp = platforms.wordpress ? new WPAPI(platforms.wordpress) : null;

const YOU_TUBE_API_ENDPOINT = "https://www.googleapis.com/youtube/v3/playlistItems";
const YOU_TUBE_API_DEFAULT_PARAMS = "?part=snippet,contentDetails";
const FETCH_SIZE = process.env["YOUTUBE_VIDEO_FETCH_SIZE"];

const getYouTubeContent = async () => {
    let success = false,
        data = [],
        playlist_ids = you_tube_channel.playlists.map(c => c.id);
    console.log("Fetching content...");
    for (let i = 0; i < playlist_ids.length; i++) {
        const url = `${YOU_TUBE_API_ENDPOINT}${YOU_TUBE_API_DEFAULT_PARAMS}&maxResults=${FETCH_SIZE}&playlistId=${playlist_ids[i]}&key=${you_tube_channel.api_key}`;
        const opts = {
            url,
            method: "GET",
            headers: {
                //check the youtube api doc for necessary headers to pass
            }
        }
        await axios(opts).then(resp => {
            success = true;
            data.push(...resp.data.items);
        }).catch(err => console.log(err))
    }

    return { total: data.length, success, data }
}

const createWordpressMedia = async (image_url, title) => {
    const img_response = await axios.get(image_url, { responseType: 'arraybuffer' })
    const img_buffer = Buffer.from(img_response.data, "utf-8");
    let newImageId = null
    await wp.media()
        .file(img_buffer, `featured-img.${image_url.split("default.")[1]}`)
        .create({
            title,
            alt_text: title,
            status: "publish"
        })
        .then(function (response) {
            newImageId = response.id;
        }).catch(err => console.log("create media error", err));
    return newImageId;
}

const createWordpressPost = async (content) => {
    let resp = null
    const { title, description, thumbnails, playlistId } = content.snippet;
    const { videoId } = content.contentDetails;
    let featured_img_id = await createWordpressMedia(thumbnails.maxres ? thumbnails.maxres.url : thumbnails.high.url, title);
    let post_data = {
        title,
        content: `
        <iframe 
           class="elementor-video" 
           allowfullscreen="1" 
           allow="accelerometer; 
           autoplay; 
           picture-in-picture"
           title=${title}
           src="https://www.youtube.com/embed/${videoId}?controls=1&amp;"
           width="640" 
           height="360" 
           frameborder="0">
         </iframe> ${description}`,
        status: 'publish',
        post_type: "vidmov_video",
        format: "video",
        featured_media: featured_img_id,
        categories: [you_tube_channel.playlists.find(p => p.id === playlistId).wp_category_id]
    }
    console.log(post_data);
    await wp.posts().create(post_data).then(async function (data) {
        resp = data
    }).catch(function (err) {
        console.log(err);
    });
    return resp
}

const postToNairaland = async (type, body, video_id) => {
    let resp = null

    const PATH = type === "topic" ? "/do_newtopic" : "/do_newpost";

    const headersList = {
        "Accept": "*/*",
        "Content-Type": "multipart/form-data; boundary=---------------------------344688158532901107891848958844",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:105.0) Gecko/20100101 Firefox/105.0",
    }

    const reqOptions = {
        method: "POST",
        headers: headersList,
    }

    //let posted_content = {};

    for (let user in nairaland_users) {
        if (!nairaland_users[user].video_ids.includes(video_id)) {
            // posted_content[user] = []
            headersList["Cookie"] = `session=${nairaland_users[user].session_id}`
            body["session"] = nairaland_users[user].session_id;
            let formdata = new FormData();
            let image = "";
            for (let field_name in body) {
                if (field_name === "body") {
                    body[field_name] = `Watch video on youtube: https://www.youtube.com/embed/${video_id}?controls=1&amp; \n\n${body[field_name]}`
                } else if (field_name === "attachment") {

                    await downloadImg(body[field_name], 'featured-img.jpg').then(async msgg => {
                        body["attachment"] = fs.createReadStream('featured-img.jpg')

                    }).catch(err => console.log("dimg err", err))
                }
                formdata.append(field_name, body[field_name])
            }

           // console.log(formdata);
            reqOptions.data = formdata;
            reqOptions.url = platforms.nairaland.endpoint + PATH;

            await axios.request(reqOptions)
                .then(response => {
                    if (response.request.res.responseUrl && response.request.path !== PATH && response.request.res.responseUrl !== platforms.nairaland.endpoint) {
                        console.log(`Posted ${video_id} successfully.`);
                        resp = {
                            user, video_id
                        }
                    } else {
                        console.log(`Failed to post ${video_id}.`);
                    }
                    return response.request.path !== PATH ? response.request.res.responseUrl : response;
                })
                .catch(err => console.log(err));
        } else {
            console.log(`User ${user} has already posted video ${video_id}.`);
        }
    }
    return resp
}

const postToFB = async (content) => {
    let resp = null
    const { title, description, thumbnails, playlistId } = content.snippet;
    const { videoId } = content.contentDetails;

   await axios.post(`https://graph.facebook.com/${FB_PAGE_ID}/feed?link=https://www.youtube.com/watch?v=${videoId}&message=${title}&access_token=${FB_ACCESS_TOKEN}`, null)
    .then(function (response){
       console.log("posted successfully", response)
       resp = response;
    })
    .catch(function (error){
        console.log(error)
    })
    return response;
}

const postToIG = async (content) => {
    let resp = null
    const { title, description, thumbnails, playlistId } = content.snippet;
    const { videoId } = content.contentDetails;
    try{
        IG.state.generateDevice(IG_USERNAME)
        await IG.simulate.preLoginFlow()
        //const user = 
        await IG.account.login(IG_USERNAME, IG_PASSWORD)

        await downloadImg(thumbnails.high.url || thumbnails.medium.url || thumbnails.default.url, 'featured-img.jpg').then(async msgg => {
          console.log("IG img download successful");

        }).catch(err => console.log("dimg err", err))

        // uploading the image to instagram
        const path = "featured-img.jpg"
        //const publish = 
        await IG.publish.photo({
            file: await readFileAsync(path),
            caption: title
        })

        const videoPath = './instagramvideo.mp4';
        const coverPath = './instagrampic.jpg';

        const publishResult = await IG.publish.video({
            video: await readFileAsync(videoPath),
            coverImage: await readFileAsync(coverPath)
        })
        console.log("publish result is ", publishResult)
    }catch(err){
        console.log(err);
    }
}

const postContentToPlatforms = async (content_arr) => {
    let platforms_posted_to = [];
    if (content_arr.length) {
        let posted_content = { ...posted_content_json };
        let nl_users = { ...nairaland_users };

        for (let platform in platforms) {
            console.log(`Posting to ${platform}...`);
            const opts = {
                url: "platform-api-url-here",
                method: "POST",
                headers: {
                    //check the platform api doc for necessary headers to pass
                }
            }
            for (let i = 0; i < content_arr.length; i++) {
                let content = content_arr[i];
                let is_new_video = !posted_content_json[platform].includes(content.contentDetails.videoId);

                if (platform === "wordpress" && is_new_video) {
                    await createWordpressPost(content).then(response => {
                        if (response) {
                            platforms_posted_to.push(platform)
                            posted_content[platform].push(content.contentDetails.videoId)
                        }
                    }).catch(err => console.log("err", err))
                } else if (platform === "facebook" && is_new_video) {
                    //put fb post logic here
                    await postToFB(content).then(response => {
                        if (response) {
                            platforms_posted_to.push(platform)
                            posted_content[platform].push(content.contentDetails.videoId)
                        }
                    }).catch(err => console.log("err", err))
                } else if (platform === "nairaland" && is_new_video) {

                     await login(functions.updateJSONFile).then(async () => { console.log("nairaland login successful.");}).catch(err => console.log("nairaland login failed."))
                    const { title, description, thumbnails, playlistId } = content.snippet;
                    const topic_board = you_tube_channel.playlists.find(p => p.id === playlistId).nairaland_board //4 //entertainment: tv & movies
                    const max_post = 32;
                    const type = "topic" 
                       // "post"
                    const topic_id = 7365083

                    const { videoId } = content.contentDetails;

                    const body = {
                        title: title.length > 80 ? title.substring(0, 80) : title, body: description, attachment: thumbnails.high.url || thumbnails.medium.url || thumbnails.default.url
                    }

                    if (type === "topic") {
                        body["board"] = topic_board
                    } else if (type === "post") {
                        body["topic"] = topic_id,
                            body["max_post"] = max_post
                    }

                    await postToNairaland(type, body, videoId).then(response => {
                        //console.log("this response");
                        //console.log(response);
                        if (response) {
                            platforms_posted_to.push(platform)
                            nl_users[response.user].video_ids.push(response.video_id)
                            posted_content[platform].push(content.contentDetails.videoId)
                        }
                    }).catch(err => console.log("err", err))
                    //}).catch(err => console.log("err", err))

                }  else if (platform === "instagram" && is_new_video) {
                    //put ig post logic here
                    await postToIG(content).then(response => {
                        if (response) {
                            platforms_posted_to.push(platform)
                            posted_content[platform].push(content.contentDetails.videoId)
                        }
                    }).catch(err => console.log("err", err))
                }
            }

            if (platforms_posted_to.includes(platform)){
                console.log(`Finished posting to ${platform}.`);
            }
            
        }

        if (platforms_posted_to.length) {
          updateJSONFile("./nairaland_users.json", nl_users);
          updateJSONFile("./posted_content.json", posted_content);
        }
       

        return posted_content
    } else {
        console.log("No content to publish.");
    }

}

const autoDiscovery = () => {
    var apiPromise = WPAPI.discover('https://gowithyo.com/wp-json');
    apiPromise.then(function (site) {
        console.log(site);
    });
}

const downloadImg = async (url, filename) => {
    let success = false, data = null;

    await axios({
        url,
        responseType: 'stream',
    }).then(
        response => {
            success = true
            new Promise((resolve, reject) => {
                image = response.data.buffer
                response.data
                    .pipe(

                        fs.createWriteStream(filename)
                    )
                    .on('finish', () => {
                        // console.log(
                        //     "done"
                        // );
                        resolve();
                    })
                    .on('error', e => reject(e));
            })
        }

    ).catch(err => console.log(err));
}

const updateJSONFile = (path, json) => {
    fs.writeFile(
        path,
        JSON.stringify(json),
        "utf-8",
        (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log(
                    path + " has been updated successfully"
                );
            }
        }
    );
}

module.exports = {
    getYouTubeContent,
    postContentToPlatforms,
    autoDiscovery,
    updateJSONFile
}