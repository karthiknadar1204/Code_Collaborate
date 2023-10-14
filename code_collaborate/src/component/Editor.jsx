// import React from 'react'
// import { useEffect } from 'react'
// import Codemirror from 'codemirror';
// import 'codemirror/lib/codemirror.css';
// import 'codemirror/mode/javascript/javascript.js'
// import 'codemirror/theme/dracula.css'
// import 'codemirror/addon/edit/closetag'
// import 'codemirror/addon/edit/closebrackets'
// import { useRef } from 'react';
// import ACTIONS from '../Actions';

// const Editor = ({socketRef,roomId}) => {
//   const editorRef = useRef(null);

//   useEffect(() => {
//     async function init() {
//       editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
//         mode: {
//           name: 'javascript',
//           json: true,
//         },
//         theme: 'dracula',
//         autoCloseTags: true,
//         autoCloseBrackets: true,
//         lineNumbers: true,
//       });

//       editorRef.current.on('changes', (instance, changes) => {
//         // console.log('changes', changes);
//         const {origin}=changes;
//         const code=instance.getValue();
//         if(origin!=='setValue'){
//           socketRef.current.emit(ACTIONS.CODE_CHANGE,{
//             roomId,
//             code
//           });
//         }
//         // console.log(code);
//       });
//     }
//     init();
//   }, []);


//   useEffect(()=>{
//     if(socketRef.current){
//       socketRef.current.on(ACTIONS.CODE_CHANGE,({code})=>{
//         if(code!==null){
//           editorRef.current.setValue(code);
//         }
//       })
//     }
//   },[socketRef.current])

//   return (
//     <>
//       <textarea id="realtimeEditor"></textarea>
//     </>
//   );
// };

// export default Editor;


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
  const syncingCodeRef = useRef(false); // Add this ref to track if code syncing is in progress

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
        
        // Check if syncingCodeRef is set to true to prevent feedback loop
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
          syncingCodeRef.current = true; // Set syncingCodeRef to true during syncing
          editorRef.current.setValue(code);
          syncingCodeRef.current = false; // Set syncingCodeRef back to false after syncing
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
