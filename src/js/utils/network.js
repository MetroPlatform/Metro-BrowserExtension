function checkErrors(response) {
    if (!response.ok) {
        throw new Error(response.status)
    }
}

const postData = (url, data, method, headers) => {
    if (headers == undefined) {
        throw new Error("[ Metro ] No Headers provided. Please pass a headers object as the third argument")
    }

    return fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => {
        checkErrors(response)
        return response
    })
    .then(response => response.json()); // parses response to JSON
}

const postMetroAPI = (url, data, token) => {
    const headers = {
        "Content-Type": "application/json"
    }
    if(token) {
        headers.Authorization = "BEARER " + token
    }

    return postData(url, data, 'POST', headers)
}

const patchMetroAPI = (url, data, token) => {
    const headers = {
        "Content-Type": "application/json"
    }
    if(token) {
        headers.Authorization = "BEARER " + token
    }

    return postData(url, data, 'PATCH', headers)
}

const getData = (url) => {
    /*
      Fetches data and throws errors if not successful
    */
    return fetch(url, { credentials: 'same-origin' })
        .then(response => {
            checkErrors(response)
            return response
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

const fetchMetroAPI = (url, accessToken) => {
    return fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    }).then(res => {
        checkErrors(res);
        return res.json()
    })
}

export { fetchText, fetchJson, fetchMetroAPI, postMetroAPI, patchMetroAPI, checkErrors }
