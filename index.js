'use strict';

const bodyParser = require('body-parser')
const express = require('express')
const app = express()

app.set('port', 8080)
app.use(bodyParser.json())

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;
  console.log('[start] listening at http://%s:%s', host, port);
});

const run_req = (req, res) => {
  console.log('openwhisk invoke request: ', req.body)
  const args = req.body.value
  invoke_jq(args).then(result => {
    res.json(result)
  }).catch(err => {
    res.status(500).json({error: err});
  })
}

app.post('/init', (req, res) => res.send())
app.post('/run',  run_req);

const invoke_jq = params => {
  if (!params.jq) {
    return Promise.reject('Missing jq parameter.')
  }

  const filter = params.jq
  delete params.jq
  return jq(JSON.stringify(params), filter).then(result => JSON.parse(result))
}

const jq = (stdin, filter) => {
  return new Promise((resolve, reject) => {
    const spawn = require('child_process').spawn;
    const process = spawn('jq', [filter]);
    const output = []

    process.stdout.on('data', (data) => {
      output.push(data)
    });

    process.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });

    process.on('exit', (code, signal) => {
      if (code !== 0) {
        return reject('jq command failed, invalid input or filter?');
      }

      console.log(`stdout: ${output.join('')}`)
      resolve(output.join(''))
    });

    process.on('err', (err) => {
      console.log(`child process errored`, err);
    });

    process.stdin.on('error', err => {
      console.log(`child process stdin emitted error, invalid filter?`);
    })

    process.stdin.write(stdin)
    process.stdin.end()
  })
}
