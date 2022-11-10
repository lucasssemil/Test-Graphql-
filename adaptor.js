const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLSchema, GraphQLInt } = require("graphql");
const { Client } = require('pg')
const joinMonster = require('join-monster')
const cors = require( `cors` );
const knex = require('knex')
const knexfile = require('./knexfile')
const jwt = require('jsonwebtoken');
const unless = require('express-unless');
const { authenticateWithExpressJWT } = require('./middleware')

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'testAngular',
  password: 'postdbLucas0218',
  port: 5432,
})

client.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  //console.log(client)
});

const UserType = new GraphQLObjectType({
    name: "User",
    type: "Query",
    fields: {
      id: { type: GraphQLString },
      username: { type: GraphQLString },
      email: { type: GraphQLString },
      joined: { type: GraphQLString },
      last_logged_in: { type: GraphQLString }
    }
  });
  
  UserType._typeConfig = {
    sqlTable: 'users',
    uniqueKey: 'id',
  }

  const ProjectType = new GraphQLObjectType({
    name: "Project",
    type: "Query",
    fields: {
      id: { type: GraphQLString },
      creator_id: { type: GraphQLString },
      created: { type: GraphQLString },
      title: { type: GraphQLString },
      description: { type: GraphQLString }
    }
  });

  ProjectType._typeConfig = {
    sqlTable: 'project',
    uniqueKey: 'id',
  }

  const QueryRoot = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        allUsers:{
            type: new GraphQLList(UserType),
            resolve: async (parent, args) => {
                const sql=`SELECT * FROM users`
                return await client
                  .query(sql)
                  .then(result => result.rows)
                  .catch(e => console.error(e.stack))
              }
        },
        projectById:{
            type: new GraphQLList(ProjectType),
            args: { creator_id: { type: GraphQLString } },
            resolve: async (parent, args) => {
                const sql={
                    text :`SELECT * FROM project WHERE creator_id = $1`,
                    values : [args.creator_id]
                }
                return await client
                  .query(sql)
                  .then(result => result.rows)
                  .catch(e => console.error(e.stack))
              }
        },
    })
  });  

  const MutationRoot = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        addProject:{
            type: ProjectType,
            args: {
                creator_id: { type: GraphQLString },
                title: { type: GraphQLString },
                description: { type: GraphQLString }
            },
            resolve: async (parent, args) => {
                const sql={
                    text: `INSERT INTO project(creator_id, created, title, description) VALUES ($1, $2, $3, $4) RETURNING title`,
                    values: [
                        args.creator_id,
                        new Date(),
                        args.title,
                        args.description
                    ]
                }
                return await client
                  .query(sql)
                  .then(result => result.rows)
                  .catch(e => console.error(e.stack))
              }
        },
        delProject:{
            type: ProjectType,
            args: {
                id: { type: GraphQLString },
            },
            resolve: async (parent, args) => {
                const sql={
                    text: `DELETE FROM project WHERE id = $1 RETURNING id`,
                    values: [
                        args.id,
                    ]
                }
                return await client
                  .query(sql)
                  .then(result => result.rows)
                  .catch(e => console.error(e.stack))
              }
        },
        updateProject:{
            type: ProjectType,
            args: {
                id: { type: GraphQLString },
                title: { type: GraphQLString },
                description: { type: GraphQLString }
            },
            resolve: async (parent, args) => {
                const sql={
                    text: `UPDATE project SET title = $1, description = $2 WHERE id = $3 RETURNING id`,
                    values: [
                        args.id,
                        args.title,
                        args.description
                    ]
                }
                return await client
                  .query(sql)
                  .then(result => result.rows)
                  .catch(e => console.error(e.stack))
              }
        },
    })
  }); 

const schema = new GraphQLSchema({
    query: QueryRoot,
    mutation: MutationRoot
 });

  // Create the Express app
const app = express();
app.use( cors() );


app.use((req, res, next)=>{
  console.log(`${req.method}`)
  next()
})
app.use('/api',graphqlHTTP({
    schema:schema,
    graphiql:true
}))

app.listen(3000, () =>
  console.log('GraphQL server running on localhost:3000/api')
);