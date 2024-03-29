"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPrev, setShard } from "@/store/slices/shard";
import { setModal } from "@/store/slices/modal";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import Close from "@/components/ui/icons/Close";
import Share from "@/components/ui/icons/Share";
import Pencil from "@/components/ui/icons/Pencil";
import Stop from "@/components/ui/icons/Stop";
import { Avatars } from "@/components/Avatars";
import { useOthers } from "@/liveblocks.config";
import { Toaster, toast } from "sonner";
import Cloud from "@/components/ui/icons/Cloud";
import { handleRoomRouteShift } from "@/lib/actions";



const RoomNavbar = ({ roomId, title: initialTitle }) => {
  const { data } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "Untitled");
  const [startEditing, setStartEditing] = useState(false);
  const dispatch = useDispatch();
  const shardState = useSelector((state) => state.shard.current);
  const prevState = useSelector((state) => state.shard.prev);
  const modal = useRef();
  const isModalOpen = useSelector((state) => state.modal.isOpen);

  useEffect(() => {
    const handleBodyClick = (e) => {
      console.log("body clicked");
      if (isModalOpen && modal.current && !modal.current.contains(e.target)) {
        dispatch(setModal(false));
      }
    };

    document.body.addEventListener("click", handleBodyClick);

    return () => {
      document.body.removeEventListener("click", handleBodyClick);
    };
  }, [isModalOpen]);


  useEffect(()=> {
    dispatch(setShard({ title: "", html: "", css: "", js: "", mode: "", id: roomId}));
    dispatch(setPrev({title: "" ,html: "", css: "", js: "", mode: "", id: roomId}));
  }, []);

  useEffect(() => {
    dispatch(setShard({ title }));
  }, [title]);

  const editTitle = () => {
    setStartEditing(true);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      setStartEditing(false);
    }
  };

  const openModal = () => {
    console.log("modal opened");
    dispatch(setModal(true));
  };

  const stopSession = () => {

    const isSaved = JSON.stringify(shardState) === JSON.stringify(prevState);
                if(!isSaved) {
                  const wantToLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
                  if(wantToLeave) {
                      router.push("/rooms-list");
                  }

                  return;
          
                }
   
                if(isSaved) {
                   console.log("saved and tab closed successfully...")
                   handleRoomRouteShift();
                }
   
  };

 
  const handleSave = async  () => {
    console.log("Save Clicked");

    if(prevState !== shardState) {
        dispatch(setPrev({...shardState}));
        const saveShard = async () => {
            const myPromise = await fetch(`/api/shard/${roomId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({html: "", css: "", js: "", title, mode: "collaboration"})
            });
    
            return myPromise;   
        }
    
        toast.promise(saveShard, {
            loading: "Saving...",
            success: () => {
                return `Saved Successfully`;
              },
              error: 'Could not save Shard',
        })

        
    }
  
    
   
   
}


  const users = useOthers();
  return (
    <div
      onKeyDown={handleEnter}
      className="bg-[#010101] flex p-4 py-2  justify-between items-center"
    >
      <div className="flex items-center gap-4">
        {startEditing ? (
          <>
            <input
              className="bg-transparent outline-none caret-white text-xl w-[50vw]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </>
        ) : (
          <h1 className="flex items-center gap text-xl">
            {title}
            <Pencil
              onClick={editTitle}
              className="cursor-pointer fill-white size-6 hover:fill-slate-500"
            />
          </h1>
        )}
      </div>
      <Toaster position="top-center" richColors/>
      <div className="flex items-center gap-4">
        <Avatars users={users}/>
        <button
          onClick={openModal}
          className="text-white flex items-center gap-2 hover:text-slate-300"
        >
          <Share className="size-4 fill-white" /> Share
        </button>
 
        <Button onClick={handleSave}><Cloud className="size-4"/>SAVE</Button>
        {isModalOpen && (
          <dialog
            ref={modal}
            onClose={() => dispatch(setModal(false))}
            className="mt-[90vh] z-50 grid items-center bg-[#1E1F26] rounded-lg p-8 py-12 text-white gap-4 border border-emerald-600"
          >
            <div className="relative flex flex-col items-center gap-4">
              <h1 className="text-[#47cf73] text-lg">Live Collaboration</h1>
              <div className="flex flex-col items-center gap-4">
                <p className=""> User: {data?.user.name}.</p>
                <button
                  onClick={stopSession}
                  className={clsx(
                    "p-4 py-2 text-white border border-white rounded-md flex items-center gap-2 text-sm",
                    "hover:border-red-600 hover:text-red-600"
                  )}
                >
                  <Stop className="size-4" /> Stop Session
                </button>
              </div>
            </div>
            <button
              className="absolute right-0 top-0 m-2 text-xl"
              onClick={() => dispatch(setModal(false))}
            >
              <Close className="size-4" />
            </button>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default RoomNavbar;
