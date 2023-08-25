require("dotenv").config();
//const cron = require("node-cron");
const functions = require("./functions");

const cron_sched_dur = process.env.SCHEDULE_DUR_IN_MIN || 2;

(async function(){
    await functions.getYouTubeContent().then(async resp => {
       console.log("Fetched content successully.");

       await functions.postContentToPlatforms(resp.data).then(response => console.log(response)).catch(err => console.log("An error occuring while posting content.", err))
    }).catch(err => console.log("An error occured while fetching content from youtube.", err))
})();