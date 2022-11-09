const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const jwt = require('jsonwebtoken');
const unless = require('express-unless');
const schema = buildSchema(`
  type Query {
    hostname: String
  }
`);
const root = {
  hostname(args, request) {
    return request.hostname;
  }
};
const verifyToken = (req, res, next) => {  
  jwt.verify(req.headers.authorization, 'secret', (err, decoded) => {
    if (err){      
      return res.send(401);
    }
    next();
  });
}
verifyToken.unless = unless;
const app = express();
app.post('/auth', (req, res) => {
  const token = jwt.sign({ foo: 'bar' }, 'secret');
  res.send(token);
})
app.use(verifyToken.unless({ path: ['/auth'] }));
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(3000, () => console.log('server started'));