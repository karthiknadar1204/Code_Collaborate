const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const path = require('path');
const { exec } = require('child_process');
const simpleGit = require('simple-git');
const axios = require('axios');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
    return {
      socketId,
      username: userSocketMap[socketId],
    };
  });
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

// ... (existing code)

socket.on(ACTIONS.CLONE_REPOSITORY, async ({ repositoryURL, roomId }) => {
    const directory = `./repositories/${roomId}`;

    try {
        // Ensure that the directory exists before attempting to clone
        exec(`mkdir -p ${directory}`, async (mkdirErr) => {
            if (mkdirErr) {
                console.error('Error creating directory:', mkdirErr);
                if (socket.connected) {
                    socket.emit(ACTIONS.CLONE_REPOSITORY_STATUS, {
                        success: false,
                        message: 'Error creating directory.',
                    });
                }
                return;
            }

            const git = simpleGit(directory);

            try {
                await git.clone(repositoryURL, directory);
            } catch (cloneError) {
                console.error('Error cloning repository:', cloneError.message);
                if (socket.connected) {
                    socket.emit(ACTIONS.CLONE_REPOSITORY_STATUS, {
                        success: false,
                        message: 'Error cloning repository.',
                    });
                }
                return;
            }

            if (socket.connected) {
                socket.emit(ACTIONS.CLONE_REPOSITORY_STATUS, {
                    success: true,
                    message: 'Repository cloned successfully.',
                });
            }
        });
    } catch (error) {
        console.error('Error cloning repository:', error.message);
        if (socket.connected) {
            socket.emit(ACTIONS.CLONE_REPOSITORY_STATUS, {
                success: false,
                message: 'Error cloning repository.',
            });
        }
    }
});
  
  socket.on(ACTIONS.PUSH_CHANGES, ({ roomId }) => {
    const directory = `./repositories/${roomId}`;
    const git = simpleGit(directory);

    git.add('./*').commit('Pushed changes').push('origin', 'main', (pushErr) => {
      if (pushErr) {
        console.error('Error pushing changes:', pushErr);
      } else {
        console.log('Changes pushed successfully.');
      }
    });
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
