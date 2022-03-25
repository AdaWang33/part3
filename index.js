// like import and export used in ES6 modules by browser 
// Node.js uses CommonJS modules
const http = require('http')
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

// customize middleware, attention required to order
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next() // yields control to the next middleware
}

app.use(express.json())
app.use(requestLogger)


let notes = [
    {
      id: 1,
      content: "HTML is easy",
      date: "2022-05-30T17:30:31.098Z",
      important: true
    },
    {
      id: 2,
      content: "Browser can execute only Javascript",
      date: "2022-05-30T18:39:34.091Z",
      important: false
    },
    {
      id: 3,
      content: "GET and POST are the most important methods of HTTP protocol",
      date: "2022-05-30T19:20:14.298Z",
      important: true
    }
  ]

// const app = http.createServer((request, response) => {
//   response.writeHead(200, { 'Content-Type': 'application/json' })
//   response.end(JSON.stringify(notes))
// })

// const PORT = 3001
// app.listen(PORT)
// console.log(`Server running on port ${PORT}`)

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})
  
app.get('/api/notes', (request, response) => {
    console.log("inside get all notes")
    response.json(notes)
})

// colon syntax
app.get('/api/notes/:id', (request, response) => {
    // id variable contains a string '1', whereas the ids of notes are integers
    const id = Number(request.params.id)
    const note = notes.find(note => note.id === id)

    // the note variable is set to undefined if no matching note is found
    // all JavaScript objects are truthy, whereas undefined is falsy 
    if(note){
        // The request is responded to with the json method of the response object     
        // Calling the method will send the notes array that was passed to it as a JSON formatted string
        response.json(note)   
    } else{
        response.statusMessage = "note with current id not found"; // very optional, override default 'Not found' msg
        response.status(404).end()
    }
})

app.delete('/api/notes/:id', (request, response) => {
    const id = Number(request.params.id)
    notes = notes.filter(note => note.id !== id)
  
    // status code should be returned to a DELETE request: 204 (no content) or 404
    response.status(204).end()
})

const generateId = () => {
    const maxId = notes.length > 0
      ? Math.max(...notes.map(n => n.id))
      : 0
    return maxId + 1
  }

app.post('/api/notes', (request, response) => {
    // The express json-parser functions so that it takes the JSON data of a request
    // transforms it into a JavaScript object 
    // and then attaches it to the body property of the request object 
    // before the route handler is called

    // two ways of checking request header
    console.log(request.headers)
    console.log(request.get('content-type'))

    const body = request.body
    if (!body) {
        // return here is crucial
        return response.status(400).json({ 
            error: 'content missing' 
        })
    }
    
    const note = {
        content: body.content,
        important: body.important || false,
        date: new Date(),
        id: generateId(),
    }
    notes = notes.concat(note)
    response.json(note)
})
  
// There are also situations where we want to define middleware functions after routes
// means that we are defining middleware functions that are only called if no route handles the HTTP request
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})