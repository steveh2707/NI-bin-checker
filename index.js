const cheerio = require("cheerio")
const axios = require("axios")
const express = require('express')
const app = express()

async function getUrl(searchterm, responseIndex) {
  responseNum = responseIndex || 0

  try {
    // downloading the target web page by performing an HTTP GET request in Axios
    const axiosResponse = await axios.request({
      method: "POST",
      url: `https://lisburn.isl-fusion.com/?searchtext=${searchterm}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
      }
    })

    // parsing the HTML source of the target web page with Cheerio
    const $ = cheerio.load(axiosResponse.data)
    let addresses = []

    $("#addressResults")
      .find(".list-unstyled li")
      .each((index, element) => {
        const address = $(element).text().trim()
        const link = $(element).find("a").attr("href").trim()
        addresses.push({ address: address, link: link })
      })

    return {
      address: addresses[responseNum].address,
      link: addresses[responseNum].link
    }
  } catch {
    return 'unable to find link'
  }
}

async function performScraping(url) {
  // downloading the target web page by performing an HTTP GET request in Axios
  const axiosResponse = await axios.request({
    method: "GET",
    url: `https://lisburn.isl-fusion.com${url}`,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
  })

  // parsing the HTML source of the target web page with Cheerio
  const $ = cheerio.load(axiosResponse.data)
  let bindates = []

  $("#nextCollectionSection")
    .find("h5")
    .each((index, element) => {
      const date = $(element).children("u").text()
      bindates.push({ date: date })
    })

  $("#nextCollectionSection")
    .find(".list-unstyled")
    .each((index, element) => {
      const bin = $(element).children("li").text().trim()
      bindates[index].bins = bin
    })

  return bindates
}

app.get('/:searchterm', (req, res) => {
  let searchTerm = req.params.searchterm
  let apiResponse = {}

  getUrl(searchTerm)
    .then(response => {
      return response
    })
    .then(response => {
      apiResponse.address = response.address
      return response
    })
    .then(response => performScraping(response.link))
    .then(bindates => {
      apiResponse.bin_dates = bindates
      res.json(apiResponse)
    })
    .catch(() => {
      res.json("couldnt find address")
    })
})

app.listen(process.env.PORT || 3000, () => {
  console.log("server started on: localhost: 3000");
});