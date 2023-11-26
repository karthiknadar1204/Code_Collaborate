import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const [repositoryURL, setRepositoryURL] = useState('');
  const [cloneStatus, setCloneStatus] = useState('');
  const [githubToken, setGithubToken] = useState('');

  const editorRef = useRef(null);
  const syncingCodeRef = useRef(false);

  const handlePushChanges = () => {
    socketRef.current.emit(ACTIONS.PUSH_CHANGES, { roomId });
  };

  useEffect(() => {
    editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
      mode: {
        name: 'javascript',
        json: true,
      },
      theme: 'dracula',
      autoCloseTags: true,
      autoCloseBrackets: true,
      lineNumbers: true,
    });

    editorRef.current.on('changes', (instance, changes) => {
      const { origin } = changes;
      const code = instance.getValue();
      onCodeChange(code);

      if (origin !== 'setValue' && !syncingCodeRef.current) {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code,
        });
      }
    });
  }, [roomId, onCodeChange, socketRef]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          syncingCodeRef.current = true;
          editorRef.current.setValue(code);
          syncingCodeRef.current = false;
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      }
    };
  }, [socketRef]);

  useEffect(() => {
    const socket = socketRef.current;

    if (socket) {
      socket.on(ACTIONS.CLONE_REPOSITORY_STATUS, ({ success, message }) => {
        if (success) {
          setCloneStatus(message);
        } else {
          console.error('Error cloning repository:', message);
          setCloneStatus('Error cloning repository.');
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CLONE_REPOSITORY_STATUS);
      }
    };
  }, [socketRef]);

const handleCloneRepository = async () => {
  try {
    const cloneRequest = {
      repositoryURL,
      roomId,
    };
    socketRef.current.emit(ACTIONS.CLONE_REPOSITORY, cloneRequest);
  } catch (error) {
    console.error('Error cloning repository:', error.message);
    setCloneStatus('Error cloning repository.');
  }
};

  return (
    <>
      <input
        type="text"
        value={repositoryURL}
        onChange={(e) => setRepositoryURL(e.target.value)}
        placeholder="GitHub Repository URL"
      />
      <input
        type="text"
        value={githubToken}
        onChange={(e) => setGithubToken(e.target.value)}
        placeholder="GitHub Token"
      />
      <button onClick={handleCloneRepository}>Clone Repository</button>
      <button onClick={handlePushChanges}>Push Changes</button>
      <textarea id="realtimeEditor"></textarea>
    </>
  );
};

export default Editor;
