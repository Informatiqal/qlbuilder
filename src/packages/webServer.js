const http = require("http");
const portfinder = require("portfinder");
// const open = require("open");

async function start() {
  return await new Promise(async (resolve) => {
    const port = 3000; //await portfinder.getPortPromise();
    let timeout;
    let qlikTicket;

    const server = http.createServer(function (req, res) {
      if (req.url.indexOf("?qlikTicket=") > -1) {
        const cookies = req.headers.cookie;
        let a = 1;
        // res.writeHead(200, { "Content-Type": "text/html" });
        // res.write("<html><body><p>This is home Page.</p></body></html>");
        clearTimeout(timeout);

        qlikTicket = req.url.split("qlikTicket=")[1].replace("qlikTicket=", "");
        res.end(function () {
          //   server.close(() => {
          console.log("server closed!");
          resolve(qlikTicket);
          //   });
        });
      }
    });

    server.listen(port);
    timeout = setTimeout(function () {
      server.close(() => {
        console.log("server closed!");
        resolve(qlikTicket);
      });
    }, 30000);
  });
}

module.exports = {
  start,
};
