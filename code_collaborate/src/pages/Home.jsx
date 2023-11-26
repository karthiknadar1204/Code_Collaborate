import React from "react";
import { useState } from "react";
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
const Home = () => {
    const [roomId,setRoomId]=useState('');
    const [username,setUsername]=useState('');
    const navigate=useNavigate();

    const createNewRoom=(e)=>{
        e.preventDefault();
        const id=uuidV4();
        setRoomId(id);
        toast.success('Created a new room'); 
    }

    const joinRoom=(e)=>{
        if(!roomId || !username){
            toast.error('Room Id and username are required');
            return;
        }
        navigate(`/editor/${roomId}`,{
            state:{
                username
            }
        })
    }

    const handleInputEnter=(e)=>{
        if(e.code==='Enter'){
            joinRoom()
        }
    }

  return (
    <div className="homePageWrapper">
      <div className="formWrapper">
        <h1>CodeCollaborate</h1>
        <h4 className="mainLabel">Paste Invitation Room ID</h4>
        <div className="inputGroup">
          <input type="text" className="inputBox" placeholder="ROOM ID" value={roomId} onChange={(e)=>setRoomId(e.target.value)} onKeyUp={handleInputEnter} />
          <input type="text" className="inputBox" placeholder="USERNAME" value={username} onChange={(e)=>setUsername(e.target.value)} onKeyUp={handleInputEnter}/>
          <button className="btn joinBtn" onClick={joinRoom} >
            join
          </button>
          <span className="createInfo">
            If you don't have an invite, then create &nbsp;
            <a onClick={createNewRoom}  href="/" className="createNewBtn" >
                new room
            </a>

          </span>
        </div>
      </div>
      <footer>
        <h4>Built with ❤️ &nbsp; by <a href="https://github.com/karthiknadar1204">Karthik Nadar</a> </h4>
      </footer>
    </div>
  );
};

export default Home;
