function checkErrors(response) {
  if(!response.ok) {
    console.error(`[ Metro ] Error fetching from URL ${response.url}`)
    console.log("Response:")
    console.log(response)
    console.log("Headers:")
    response.headers.forEach(console.log)

    switch(response.status) {
      case 404:
        throw new Error(`Encountered Error 404 while fetching from URL ${response.url}`);
      case 500:
        throw new Error(`Encountered Error 500 while fetching from URL ${response.url}`);
      default:
        throw new Error(`Error occurred while fetching URL ${response.url}`)
    }  
  }
}

const postData = (url, data) => {
  return fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
          "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data), // body data type must match "Content-Type" header
  })
  .then(response => {
    checkErrors(response)
    return response
  })
  .then(response => response.json()); // parses response to JSON
}

const postMetroAPI = (url, data) => {
  return postData(url, data).then(res => {
    if(res.status == 1) {
      return res.content
    } else {
      console.error(`Failed to POST ${url}. Data:`)
      console.log(data)
      throw new Error(res.message)
    }
  })
}

const getData = (url) => {
  /*
    Fetches data and throws errors if not successful
  */
  return fetch(url, {credentials: 'same-origin'})
          .then(response => {
            checkErrors(response)
            return response
          })
          .catch(reason => {
            console.log(reason)
          })
}

const fetchJson = (url) => {
  return getData(url)
          .then(response => {
            return response.json()
          })   
}

const fetchText = (url) => {
  return getData(url)
          .then(response => {
            return response.text()
          })   
}

const fetchMetroAPI = (url) => {
  return fetchJson(url)
          .then(resp => {
            if(resp.status == 1) {
              return resp.content
            } else {
              throw new Error(resp.message)
            }
          })
}

export { fetchText, fetchJson, fetchMetroAPI, postMetroAPI }
