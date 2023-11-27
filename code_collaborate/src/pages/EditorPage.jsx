import React from 'react'
import { useState } from 'react'
import Client from '../component/Client';
import Editor from '../component/Editor';
import { useRef } from 'react';
import { useEffect } from 'react';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { useLocation, useNavigate,Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
const EditorPage = () => {
  const socketRef=useRef(null);
  const codeRef=useRef(null);
  const location=useLocation();
  const reactNavigator=useNavigate();
  const {roomId}=useParams();
  const copyRoomId =async()=>{
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('ROOM ID has been copied to your clipboard')
    } catch (error) {
      toast.error('Could not copy the ROOM ID')
      console.error(error);
    }
  }
  const leaveRoom=()=>{
    reactNavigator('/');
  }
  const[clients,setClients]=useState([]);

  useEffect(() => {
    const handleErrors = (e) => {
      console.log('socket error', e);
      toast('socket connection failed, try again later');
      reactNavigator('/');
    };
  
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));
  
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });
  
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room`);
          console.log(`${username} joined`);
        }
        setClients(clients);
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });
  
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
  
    init();
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, []);
  
  if (!location.state) {
    return <Navigate to={'/'} />;
  }
  return (
    <div className='mainWrap' >
      <div className="aside"> 
        <div className="asideInner">
          <div className="logo">
            CodeCollaborate
          </div>
          <h3>Connected</h3>
          <div className="clientList">
            {
              clients.map((client)=>(
                <Client 
                key={client.userId}
                username={client.username} />
              ))
            }

          </div>
        </div>
        <button className='btn copyBtn' onClick={copyRoomId} >
            COPY ROOM ID
        </button>
        <button className='btn leaveBtn' onClick={leaveRoom} >
          LEAVE
        </button>
      </div>
        <div className="editorWrap">
          <Editor socketRef={socketRef}  roomId={roomId} onCodeChange={(code)=>{codeRef.current=code}} />
        </div>
    </div>
  )
}
export default EditorPage