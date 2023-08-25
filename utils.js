const platforms = {
    "wordpress": {
         endpoint: "https://gowithyo.com/wp-json",
         username: process.env["USERNAME"],
         password: process.env["PASSWORD"],
         auth: true
    },
    "facebook": {},
    "twitter": {},
    "instagram": {},
    "nairaland": {
        endpoint: "https://www.nairaland.com",
    },
    // "tiktok": {}
}
const nairaland_forums = {
    "politics": {
        board_id: 20
    },
    "crime": {
        board_id: 1
    },
    "romance": {
        board_id: 21
    },
    "vacancies": {
        board_id: 29
    },
    "career" : {
        board_id: 35
    },
    "business": {
        board_id: 24
    },
    "investment": {
        board_id: 81
    },
    "nysc": {
        board_id: 79
    },
    "education": {
        board_id: 13
    },
    "autos": {
        board_id: 26
    },
    "car-talk": {
        board_id: 78
    },
    "properties": {
        board_id: 47
    },
    "health": {
        board_id: 19
    },
    "travel": {
        board_id: 2
    },
    "family": {
        board_id: 5
    },
    "culture": {
        board_id: 55
    },
    "religion": {
        board_id: 17
    },
    "food": {
        board_id: 41
    },
    "diaries": {
        board_id: 31
    },
    "ads": {
        board_id: 80
    },
    "pets": {
        board_id: 84
    },
    "agriculture": {
        board_id: 85
    },



    "jokes": {
        board_id: 15
    },
    "tv-movies": {
        board_id: 4
    },
    "music-radio": {
        board_id: 3
    },
    "celebrites": {
        board_id: 46
    },
    "fashion": {
        board_id: 37
    },
    "events": {
        board_id: 7
    },
    "sports": {
        board_id: 14
    },
    "gaming": {
        board_id: 10
    },
    "forum-games": {
        board_id: 33
    },
    "literature": {
        board_id: 11
    },

    "programming": {
        board_id: 34
    },
    "webmasters": {
        board_id: 30
    },
    "computers": {
        board_id: 22
    },
    "phones": {
        board_id: 16
    },
    "art-graphics-video": {
        board_id: 45
    },
    "technology-market": {
        board_id: 54
    }
}

const you_tube_channel = {
    id: process.env["YOUTUBE_CHANNEL_ID"],
    api_key: process.env["YOUTUBE_API_KEY"],
    playlists: [
        { id: "PLYzLYBdULslCXGxc_4AxfjnmyTvI-ThXX", title: "How-tos", category: "How tos", wp_category_id: 688, nairaland_board: nairaland_forums.education.board_id },
        { id: "PLYzLYBdULslCVfIPYUkwApFB5qkRDfA11", title: "Sports Show", category: "Entertainment", wp_category_id: 686, nairaland_board: nairaland_forums.sports.board_id },
        { id: "PLYzLYBdULslDDqbxnUMaepTkQF5-aEPC8", title: "VOX Pop Streets Teaser", category: "Entertainment", wp_category_id: 686, nairaland_board: nairaland_forums.jokes.board_id }
    ]
}

module.exports = {
    platforms,
    nairaland_forums,
    you_tube_channel
}