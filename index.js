// like import and export used in ES6 modules by browser 
// Node.js uses CommonJS modules
require('dotenv').config()
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
app.use(express.static('build'))

const Note = require('./models/note')

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

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})
  
app.get('/api/notes', (request, response) => {
    // response.json(notes)
    Note.find({}).then(notes => {
      response.json(notes)
    })
})

// // colon syntax
// app.get('/api/notes/:id', (request, response) => {
//     // id variable contains a string '1', whereas the ids of notes are integers
//     const id = Number(request.params.id)
//     const note = notes.find(note => note.id === id)

//     // the note variable is set to undefined if no matching note is found
//     // all JavaScript objects are truthy, whereas undefined is falsy 
//     if(note){
//         // The request is responded to with the json method of the response object     
//         // Calling the method will send the notes array that was passed to it as a JSON formatted string
//         response.json(note)   
//     } else{
//         response.statusMessage = "note with current id not found"; // very optional, override default 'Not found' msg
//         response.status(404).end()
//     }
// })

app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        response.json(note)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndRemove(request.params.id)
    .then(result => {
      // status code should be returned to a DELETE request: 204 (no content) or 404
      response.status(204).end()
    })
    .catch(error => next(error))
})

const generateId = () => {
    const maxId = notes.length > 0
      ? Math.max(...notes.map(n => n.id))
      : 0
    return maxId + 1
  }

// app.post('/api/notes', (request, response) => {
//     // The express json-parser functions so that it takes the JSON data of a request
//     // transforms it into a JavaScript object 
//     // and then attaches it to the body property of the request object 
//     // before the route handler is called

//     // two ways of checking request header
//     console.log(request.headers)
//     console.log(request.get('content-type'))

//     const body = request.body
//     if (!body) {
//         // return here is crucial
//         return response.status(400).json({ 
//             error: 'content missing' 
//         })
//     }
    
//     const note = {
//         content: body.content,
//         important: body.important || false,
//         date: new Date(),
//         id: generateId(),
//     }
//     notes = notes.concat(note)
//     response.json(note)
// })

app.post('/api/notes', (request, response) => {
  const body = request.body

  if (body.content === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  })
})

app.put('/api/notes/:id', (request, response, next) => {
  const body = request.body

  const note = {
    content: body.content,
    important: body.important,
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})
  
// There are also situations where we want to define middleware functions after routes
// means that we are defining middleware functions that are only called if no route handles the HTTP request
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)


const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 

  next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})