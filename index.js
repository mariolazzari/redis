const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const client = redis.createClient(6379);

const app = express();

const setResponse = (username, data) =>
  `<h2>${username} has ${data} github repos.</h2>`;

// cahce middleware
const cache = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) {
      throw err;
    }

    if (data) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
};

// get git repos
app.get("/repos/:username", cache, async (req, res, next) => {
  try {
    console.log("Fetchong data...");
    const { username } = req.params;
    const resp = await fetch(`https://api.github.com/users/${username}`);
    const data = await resp.json();

    // save data in redis
    const repos = data.public_repos;
    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

app.listen(5000, () => console.log("Express started on port 5000"));
