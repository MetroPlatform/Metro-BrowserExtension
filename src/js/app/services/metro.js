import { fetchMetroAPI, postMetroAPI, patchMetroAPI, checkErrors } from "../../utils/network";
import Settings from "../../utils/settings";

const settings = new Settings()

class Metro {

    constructor(clientId, clientSecret) {
        // this.base = 'http://127.0.0.1:8000'
        this.base = 'https://getmetro.co'

        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    //////////////////
    /// Properties ///
    //////////////////

    /*
    *   Checks whether or not the user is logged in and has credentials
    *   
    *   Tries to get a "user" object, if it doesn't exist
    */
    loggedIn = async () => {
        try {
            const credentials = await this._getCredentials()
            if(this.user && credentials) {
                return true;
            } else {
                return false
            }
        } catch(err) {
            console.error(err)
            return false;
        }
    }

    ////////////////////////
    /// STATE MANAGEMENT ///
    ////////////////////////

    _getCredentials = async () => {
        return await settings.getCredentials()
    }

    _saveCredentials = async (credentials) => {
        await settings.setCredentials(credentials)
    }

    /*
    *   Uses the user's credentials to get their Profile information
    */
    _login = async (credentials) => {
        try {
            await this._saveCredentials(credentials)
            const user = await this.profile.profile()
            this.user = user
        } catch(err) {
            console.error(err)
            return;
        }
    }

    _setUser = async () => {
        try {
            const user = await this.profile.profile();
            this.user = user;
        } catch(err) {
            this.user = null;
            return;
        }
    }

    setup = async () => {
        await this._setUser()
    }

    //////////////////
    /// AUTH CALLS ///
    //////////////////

    login = async (username, password) => {
        const body = `grant_type=password&username=${username}&password=${password}`

        const path = "/o/token/";
        const loginData = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
                "Content-Type": 'application/x-www-form-urlencoded'
            },
            body: body
        }
        const response = await fetch(this.base + path, loginData)

        const parsedResponse = await response.json()
        if(parsedResponse.error) {
            throw new Error(parsedResponse.error_description)
        } else {
            await this._login(parsedResponse)
            this.setInstalled()
        }
    }

    /*
    *   Removes the user's credentials, and sets the 'user' to null
    */
    logout = () => {
        settings.setCredentials(null);
        this.user = null;
    }

    /*
        Refreshes the Access Token, using the Refresh Token
    */
    refreshAccessToken = async () => {
        const credentials = await settings.getCredentials()
        if(!credentials) {
            throw new Error("No credentials.")
        }
        
        const body = `grant_type=refresh_token&refresh_token=${credentials.refresh_token}`

        const path = "/o/token/";
        return fetch(this.base + path, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
                "Content-Type": 'application/x-www-form-urlencoded'
            },
            body: body
        }).then(res => {
            checkErrors(res)
            return res.json();
        }).then(res => {
            this._saveCredentials(res)
        }).catch(reason => {
            console.error("Error refreshing token")
            throw reason
        })
    }

    _sendRequestOrRefresh = async (path, method, data) => {
        try {
            const credentials = await settings.getCredentials()
            if(credentials === null) {
                throw new Error("No credentials")
            }
            const token = credentials.access_token

            switch(method) {
                case "GET":
                    return await fetchMetroAPI(path, token)
                case "POST":
                    return await postMetroAPI(path, data, token)
                case "PATCH":
                    return await patchMetroAPI(path, data, token)
            }
            
        } catch(err) {
            if(err.message == "403" || err.message == "401") {
                await this.refreshAccessToken()
                const updatedCredentials = await settings.getCredentials()
                switch(method) {
                    case "GET":
                        return await fetchMetroAPI(path, updatedCredentials.access_token)
                    case "POST":
                        return await postMetroAPI(path, data, updatedCredentials.access_token)
                    case "PATCH":
                        return await patchMetroAPI(path, data, updatedCredentials.access_token)
                }
            } else {
                throw err;
            }
        }
    }

            //////////////////////
            ///  HTTP METHODS  ///
            //////////////////////

    /*
    *   Makes an authorized API call, and refreshes the token if needed
    */
    _get = async (path) => {
        return await this._sendRequestOrRefresh(path, "GET")
    }

    _post = async (path, data) => {
        return await this._sendRequestOrRefresh(path, "POST", data)
    }

    _patch = async (path, data) => {
        return await this._sendRequestOrRefresh(path, "PATCH", data)
    }

            /////////////////
            /// API CALLS ///
            /////////////////

    sendDatapoint = (datapoint, apiKey) => {
        const url = "https://push.getmetro.co"
        const headers = {
            "Content-Type": "application/json",
            "X-API-Key": apiKey
        }

        return fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(datapoint), // body data type must match "Content-Type" header
        }).catch(err => console.error(err))
    }

    sendDatapointNew = (datapoint) => {
        const path = "/api/v0.1/push"
        return this._post(this.base + path, datapoint)
    }


    setInstalled = async () => {
        await this.profile.setProfile({
            profile: {
                extension_installed: true
            }
          })
    }

    feeds = {
        /*
        *   Gets the feed for a given slug
        *
        *       /api/v0.1/feeds/<slug>/
        */
        feedDetail: (slug) => {
            const path = `/api/v0.1/feeds/${slug}/`
            return this._get(this.base + path)
        },
        /*
        *   Gets the feed for a given slug
        *
        *       /api/v0.1/feeds/<slug>/content
        */
        feedContent: (slug) => {
            const path = `/api/v0.1/feeds/${slug}/content`
            return this._get(this.base + path)
        }
    }

    users = {
        /*
        *   Returns all of the users 
        *
        *       /api/v0.1/users/all/
        *
        *   ** TODO: DELETE THIS **
        */
        all: () => {
            const path = "/users/"
            return this._get(this.base + path)
        },
    }

    profile = {
        /*
        *   Gets the user's profile
        *
        *       /api/v0.1/v0.1/profile/
        */
        profile: () => {
            const path = "/api/v0.1/profile/";
            return this._get(this.base + path)
        },
        /*
        *   Posts the user's profile
        *
        *       /api/v0.1/v0.1/profile/
        */
       setProfile: (data) => {
        const path = "/api/v0.1/profile/";
        return this._patch(this.base + path, data)
    },
        /*
        *   Gets the API Key for pushing data to Metro
        *
        *       /api/v0.1/v0.1/profile/apiKey
        */
       getApiKey: () => {
           const path = "/api/v0.1/profile/apiKey"
           return this._get(this.base + path)
       },
        /*
        *   Gets the user's favourite feeds
        *
        *       /api/v0.1/v0.1/profile/favourites
        */
        favourites: () => {
            const path = "/api/v0.1/profile/favourites"
            return this._get(this.base + path)
        },
        /*
        *   Gets the DataSources that the user has activated
        *
        *           /api/v0.1/profile/datasources
        */
       datasources: () => {
           const path = "/api/v0.1/profile/datasources"
           return this._get(this.base + path)
       }
    }
}

export default Metro;