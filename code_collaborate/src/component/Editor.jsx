import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId,onCodeChange }) => {
  const editorRef = useRef(null);
  const syncingCodeRef = useRef(false); 

  useEffect(() => {
    async function init() {
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
            code
          });
        }
      });
    }
    init();
  }, []);

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
  }, [socketRef.current]);

  return (
    <>
      <textarea id="realtimeEditor"></textarea>
    </>
  );
};

export default Editor;
