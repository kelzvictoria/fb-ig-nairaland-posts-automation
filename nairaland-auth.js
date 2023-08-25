const axios = require("axios");
axios.defaults.withCredentials = true;
const FormData = require("form-data");
const users = require("./nairaland_users.json");

const headersList = {
  Accept: "*/*",
  "Content-Type":
    "multipart/form-data; boundary=---------------------------344688158532901107891848958844",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:105.0) Gecko/20100101 Firefox/105.0",
  Connection: "keep-alive",
  "Accept-Encoding": "gzip, deflate, br",
  "Access-Control-Allow-Origin": "https://www.nairaland.com",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Header":
    "Origin, X-Requested-With, Content-Type, Accept",
};

const parseCookies = (cookie = "") =>
  cookie
    .split(";")
    .map((v) => v.split("="))
    .map(([k, ...vs]) => [k, vs.join("=")])
    .reduce((acc, [k, v]) => {
      acc[k.trim()] = decodeURIComponent(v);
      return acc;
    }, {});

const login = async (updateJSONFile) => {
  let nairaland_users = users;
  for (let user in nairaland_users) {
    console.log("logging into nairaland...");
    let redirect_url = "",
      session = "",
      cookies = {};
    const opts = {
      method: "POST",
      url: "https://www.nairaland.com/do_login",
      maxRedirects: 0,
      validateStatus: null,
      headers: headersList,
    };

    const formdata = new FormData();
    formdata.append("name", user);
    formdata.append("password", nairaland_users[user].password);
    formdata.append("redirect", "");

    opts.data = formdata;
    await axios
      .request(opts)
      .then(async (response) => {
        redirect_url = response.headers.location;
        opts.url = redirect_url;
        delete opts.data;

        axios.interceptors.response.use(
          (resp) => {
            return resp;
          },
          (error) => {
            return Promise.reject(error.message);
          }
        );

        await axios.request(opts).then((respp) => {
          cookies = parseCookies(respp.headers["set-cookie"][0]);
          session = cookies.session;
          console.log("session", session);
          if (session && session !== '""') {
            nairaland_users[user].session_id = session;
          } else {
            console.log("No Session ID.");
          }
        });
      })
      .catch((err) => console.log(err));
    updateJSONFile("./nairaland_users.json", nairaland_users);
    return { redirect_url, session_id: session };
  }
};

module.exports = {
  login,
};
