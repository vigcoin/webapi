export = {
  urls: [
    "/wallet/open"
  ],
  bodies: {
    post: {
      file: true
    }
  },
  sessions: {
    get: {
      session: true
    },
    post: {
      session: true
    }
  },
  routers: {
    post: async () => {

      console.log("inside post");


    }
  },
  validations: {
    post: {
      body: {
        filename: {
          type: "string"
        },
        password: {
          type: "string"
        }
      }
    }
  }
};
