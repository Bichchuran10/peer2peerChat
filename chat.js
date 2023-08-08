"use strict";
var sessionBadge = $("#session-badge");
var chatWindow = $("#chat");
var userList = $("#user-list");
var messageBox = $("#message");
var modalDisplayed = false;
var joinRequestModal = $("#join-request-modal");
var confirmationModal = $("#confirmation-modal");
var confirmationTitle = $("#confirm-action-title");
var confirmationActionText = $("#confirm-action-description");
var placeLocation = document.getElementById("location-id");
// var myLocationInput = myLocation.querySelector("input");
var myLocationInput;
var confirmationAction;
var publicCheck;
var someid;
var connectedUsers = new Map();

var allUsers = [];
// var heartbeatInterval;
// let inactivityTimeout;
// const inactivityDuration = 60000; // 60 seconds of inactivity before triggering disconnection

const imageFileExtensions = /\.(bmp|apng|gif|ico|jpg|jpeg|png|svg|webp)$/;
const youTubeURL = /^http(s)?:\/\/www.youtube.com\/watch\?v=([^&]+)(&(.*))?$/;
const slideShareURL =
  /http(s)?:\/\/www.slideshare.net\/([\w-]+\/[\w-]+)((\/?$)|\?)/;

var joinRequests = [];
// var sessions = [];

function processJoinRequest() {
  console.log("join request.....");
  console.log("join req arr=", joinRequests);
  if (modalDisplayed) {
    return;
  }

  if (joinRequests.length == 0) {
    joinRequestModal.modal("hide");
  } else {
    var userID = joinRequests[0];
    $(".requesting-user-id").html(userID);
    joinRequestModal.modal("show");
  }
}

$("#accept-join").on("click", function (event) {
  console.log("acept join,,.....");
  var userID = joinRequests.shift();
  group.acceptUser(userID);
  processJoinRequest();
});

$("#reject-join").on("click", function (event) {
  var userID = joinRequests.shift();
  group.rejectUser(userID);
  processJoinRequest();
});

function disconnected() {
  console.log("function disconnected.......");
  connected = false;
  sessionBadge.css("visibility", "hidden");
  connectButton.html("Connect");
  connectButton.addClass("btn-primary");
  connectButton.removeClass("btn-secondary");
  $(".login-detail").slideDown({ easing: "linear", duration: 2000 });
  userList.children(":not([value=everyone])").remove();
}

connectButton.on("click", async function (event) {
  console.log("clicked connect");
  alertArea.html("");

  if (connected) {
    event.preventDefault();
    group.disconnect();

    console.log("some id ", someid);
    console.log("some id ", myUserID);
    console.log("some id ", myLocationID);
    // console.log("some id ", sessionID); //undefined
    // console.log("hahhahhahhah==========", myUserID);
    // console.log("hahhahhahhah==========", myLocationID);
    // console.log("hahhahhahhah==========", sessionID);
    disconnected();
    if (myLocationID) {
      console.log("since it is a public room.....");
      console.log("SESSION ID = ", someid);
      await clearFromMap(myUserID, myLocationID, someid);
    }

    console.log("inside connectButton.on event", event);
    console.log("inside connectButton.on event", group);
    chatWindow.append(`
    	<div class="chat system-message">
    		<span class="user-id">${myUserID}</span>
    		has left the conversation.
    	</div>
    `);
  } else {
    if (document.getElementById("login-form").checkValidity()) {
      event.preventDefault();
      console.log(
        "first this thing gets executed ....here initializeNetworking is getting called"
      );
      //   console.log("locationnnn", myLocationInput);
      //   console.log("event", event.target.mylocation.value);

      console.log("eventtttt :", event);

      initializeNetworking();

      console.log(
        "after execution of initialize networking connected",
        connected
      );
      console.log("my userID ============", myUserID);
      connected = true;
      $(".login-detail").slideUp();
      connectButton.html("Disconnect");
      console.log("inside connectButton.on if(connected) IS FALSE ....");
      connectButton.addClass("btn-secondary");
      connectButton.removeClass("btn-primary");

      myUserID = $("#user-id").val();
      myUserID = myUserID.replace(/\s{2,}/g, " ").replace(/\s$/, "");
      var sessionID = $("#session-id").val();
      if (sessionID === "") {
        sessionID = undefined;
      }
      myLocationID = $("#location-id").val();

      //   myLocationInput = $("#location-id").val();
      publicCheck = $("#public-id").val();
      console.log("myyyyyyyy loccccccccc=========", myLocationInput);
      console.log("myyyyyyyy public check =========", publicCheck);

      console.log("myyyyyyyy loccccccccc=========", myLocationInput);
      console.log("sessionID = " + sessionID);
      console.log("myUserID = " + myUserID);
      //   group.connect(sessionID, myUserID);
      if (publicCheck) {
        someid = await generateRoomID(myUserID, myLocationID);
        sessionID = someid;
      }

      console.log("final session ID");
      group.connect(sessionID);
      myUserID = escapeHTML(myUserID);
      console.log("what is a group : ", group);
      console.log("again myUserID: ", myUserID);
      // Start the inactivity timer when the page loads or the user connects to the chat
      // resetInactivityTimeout();

      // console.log("peer iddddd", peer);
    }
  } // end if connected else not connected
});

userList.on("input", function (event) {
  $("#ban-user-btn").prop("disabled", $(this).val() === "everyone");
});

$("#ban-user-btn").on("click", function (event) {
  var userToBan = userList.val();
  var username = userList.children(`[value=${userToBan}]`).html();
  confirmationTitle.html("Ban " + username);
  confirmationActionText.html(`ban <span class="user-id">${username}</span>`);
  confirmationAction = "ban-user";
  confirmationModal.modal("show");
});

$("#confirm-action-btn").on("click", function (event) {
  switch (confirmationAction) {
    case "ban-user":
      let userToBan = userList.val();
      console.log("userToBan=", userToBan);
      group.rejectUser(userToBan);
      console.log("reject user executed..");
      break;
  }
  confirmationModal.modal("hide");
});

async function initializeNetworking() {
  let connectionOptions = parseSignallingURL($("#server-url").val());
  console.log("inside initializeNetworking", connectionOptions);
  // console.log(connectionOptions)
  connectionOptions.path = "/peerserver/ss";
  group = new PeerGroup(function (error) {
    console.error(error.type + ": " + error);
    debugger;
  }, connectionOptions);
  console.log("peer group is : ", PeerGroup);
  console.log("group :", group);

  group.addEventListener("connected", async function (event) {
    console.log("group eventListener connected : ", group);
    console.log("group eventListener connected event: ", event);

    // group.addUserToTheGroup(event.userID);
    // allUsers.push({
    //   userID: event.userID,
    //   heartbeat: 0,
    // });
    // console.log("allusers", allUsers);

    alertArea.append(`
			<div class="alert alert-info" id="pending-join-alert">
				Connected to ${event.sessionID}. Waiting for permission to join the conversation&hellip;
			</div>
		`);
    // await addToMap(event.peerID, event.sessionID);
    // const intervalId = setInterval(async () => {
    //   console.log("pppppp", event.peerID);
    //   await sendMessageToServer(event.peerID);
    // }, 7000);
  });

  group.addEventListener("joined", async function (event) {
    console.log("joined event : ", event);
    console.log("timestamp in joined event : ", event.messageTime);
    messageBox[0].focus();

    $("#pending-join-alert").remove();
    var alert = $(`
			<div class="alert alert-success alert-dismissible">
				You're now part of the conversation "${event.sessionID}".
				<button type="button" class="close" data-dismiss="alert" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
	  		</div>
		`);
    alertArea.append(alert);
    fadeOutAndRemove(alert);

    chatWindow.append(`
			<div class="chat system-message">
				<span class="user-id">${myUserID}</span> is present.
			</div>
		`);

    sessionBadge.html(
      '<span class="sr-only">The current session name is </span>' +
        event.sessionID
    );
    sessionBadge.css("visibility", "visible");

    if (event.administrator) {
      console.log("event adminnnnn");
      $("#ban-user-btn").show();
    }
  });

  group.addEventListener("ejected", function (event) {
    console.log("ejectedddddddddddddddddddddddddddddddddd.......");
    $("#pending-join-alert").remove();
    alertArea.append(`
			<div class="alert alert-warning">
				${event.message}
			</div>
		`);
    disconnected();
  });

  // Uncomment to enable asking host's permission to join room
  // group.addEventListener('joinrequest', function (event) {
  // 	if (event.userID === 'everyone') {
  // 		group.
  // userID;
  // 	} else {
  // 		joinRequests.push(event.userID);
  // 		if (joinRequests.length == 1) {
  // 			processJoinRequest();
  // 		}
  // 	}
  // });

  group.addEventListener("userpresent", function (event) {
    var userID = event.userID;
    console.log("userpresent event listener userID", userID);
    console.log("userpresent event listener sessionID", event.sessionID);
    chatWindow.append(`
			<div class="chat system-message">
				<span class="user-id">${userID}</span> is present.
			</div>
		`);
    var userListOptions = userList.children();
    var newOption = `<option value="${userID}">${userID}</option>`;
    var inserted = false;
    for (let i = 0; i < userListOptions.length; i++) {
      let option = userListOptions.eq(i);
      let value = option.attr("value");
      if (value > userID && value !== "everyone") {
        $(newOption).insertBefore(option);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      userList.append(newOption);
    }
  });

  group.addEventListener("userleft", function (event) {
    console.log("user left event : ", event);

    console.log(event.isAdmin);

    // // console.log("some id ", someid);
    // console.log("some id ", event.sessionID);

    // console.log("some id ", myLocationID);

    // if (myLocationID) {
    //   console.log("since it is a public room.....");
    //   console.log("myUser id", myUserID);
    //   console.log("some id ", event.userID);
    //   console.log("SESSION ID = ", event.sessionID);
    //   console.log("some id ", event.locationID);

    //   await clearFromMap(event.userID, event.locationID, event.sessionID);
    //   console.log("clearFROMMAP executed....");
    // }

    var userID = event.userID;
    chatWindow.append(`
			<div class="chat system-message">
				<span class="user-id">${userID}</span>
				has left the conversation.
			</div>
		`);
    userList.children(`[value=${userID}]`).remove();
    // if (event.userID) {
    //   console.log("admin left so create new sessions for every other user");
    //   adminLeft();
    // }
  });

  group.addEventListener("message", function (event) {
    var text = formatAsHTML(event.message);
    var scrolledToBottom =
      chatWindow.scrollTop() >=
      chatWindow[0].scrollHeight - chatWindow.height() - 1;
    var annotation;
    if (event.isPrivate) {
      annotation = " (Private)";
    } else {
      annotation = "";
    }
    chatWindow.append(`
			<div class="chat">
				<span class="user-id">${event.userID}${annotation}:</span>
				<pre>${text}</pre>
			</div>
		`);
    if (scrolledToBottom) {
      chatWindow.scrollTop(chatWindow[0].scrollHeight);
    }
  });

  group.addEventListener("adminMessage", function (event) {
    console.log("the event", event);
    var text = formatAsHTML(event.message);
    // group.send(makeMessage(MsgType.ACKNOWLEDGED, "acknowwwl"));
    console.log("the text", text);
    // group.acknowledgement(event.userID);
    // group.acknowledgement(event.userID);
    console.log("acknowledgement executed....");
    group.sendPrivateAdmin(event.userID, "received......");
  });

  group.addEventListener("rejecting", function (event) {
    let userToBeRejected = formatAsHTML(event.message);
    console.log("TEXT FROM ADMIN ,,,REJECTTTT", userToBeRejected);
    console.log("the ev AAAAAA", event);
    group.rejectUser(userToBeRejected);

    console.log("ALLLLLLLLLLLL DONE");
  });
  group.addEventListener("acknowledged", function (event) {
    console.log("ACKKK", event);
    console.log("heLLLLLLLLLLLLLLLLOOOOOOOOOOOOOOOO");
    let tot = event.totalUsersInTheGroup;

    group.receiveID(event.userID);
    console.log("totttt", tot);

    // connectedUsers.set(event.userID, 0);

    // if (!connectedUsers.has(event.userID)) {
    //   connectedUsers.set(event.userID, 0); // Start the count at 0 for ACKNOWLEDGEMENT RECEIVED
    // } else {
    //   connectedUsers.set(event.userID, connectedUsers.get(event.userID) + 1);
    // }

    // console.log("connected users map : ", connectedUsers);

    // group.sendPrivate(destination, textToSend);
  });

  return group;
}

function resizeMessageBox() {
  messageBox.css("min-height", "");
  var height = Math.min(messageBox[0].scrollHeight + 2, 250);
  messageBox.css("min-height", height + "px");
}

messageBox.on("input", function (event) {
  resizeMessageBox();
});

messageBox.on("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (event.ctrlKey) {
      messageBox.val(messageBox.val() + "\n");
      resizeMessageBox();
    } else {
      let textToSend = messageBox.val();
      let formattedText = formatAsHTML(textToSend);
      let scrolledToBottom =
        chatWindow.scrollTop() >=
        chatWindow[0].scrollHeight - chatWindow.height() - 1;
      let destination = escapeHTML(userList.val());
      let annotation;
      if (destination === "everyone") {
        annotation = "";
      } else {
        annotation = ` (to ${destination})`;
      }
      chatWindow.append(`
				<div class="chat">
					<span class="user-id">${myUserID}${annotation}:</span>
					<pre>${formattedText}</pre>
				</div>
			`);
      messageBox.val("");
      resizeMessageBox();
      if (scrolledToBottom) {
        chatWindow.scrollTop(chatWindow[0].scrollHeight);
      }
      if (destination === "everyone") {
        console.log("sending TO EVERYONE....");

        group.send(textToSend);
      } else {
        console.log("sending to specific....");
        console.log("the destination=", destination);
        console.log("the textoSend=", textToSend);
        group.sendPrivate(destination, textToSend);
      }
    }
  } else if (event.key === "Tab") {
    let start = messageBox[0].selectionStart;
    let end = messageBox[0].selectionEnd;
    let currentValue = messageBox.val();
    let before = currentValue.slice(0, start);
    let after = currentValue.slice(end);
    if (start === end) {
      if (!event.shiftKey) {
        event.preventDefault();
        messageBox.val(before + "\t" + after);
        messageBox[0].selectionStart = start + 1;
        messageBox[0].selectionEnd = start + 1;
      }
    } else {
      event.preventDefault();
      let selection = currentValue.slice(start, end + 1);
      let lines = selection.split("\n");
      let newValue;
      if (event.shiftKey) {
        let allLinesTabbed = lines.every(function (line) {
          return line[0] === "\t" || line === "";
        });
        if (allLinesTabbed) {
          let newLines = lines.map(function (line) {
            return line.slice(1);
          });
          newValue = before + newLines.join("\n") + after;
        } else {
          return;
        }
      } else {
        newValue = before + "\t" + lines.join("\n\t") + after;
      }
      messageBox.val(newValue);
      messageBox[0].selectionStart = start;
      messageBox[0].selectionEnd = start + newValue.length;
    }
  }
});

$(".modal:not(#join-request-modal)").on("show.bs.modal", function (event) {
  modalDisplayed = true;
});

$(".modal:not(#join-request-modal)").on("hidden.bs.modal", function (event) {
  modalDisplayed = false;
  processJoinRequest();
});

async function fetchRoomID(myUserID, myLocationID) {
  // const myUserID = "your_username"; // Replace with the actual value
  // const myLocationID = "your_location_id"; // Replace with the actual value

  const url = `http://localhost:9000/getRoom?username=${encodeURIComponent(
    myUserID
  )}&mylocation=${myLocationID}`;

  try {
    const response = await fetch(url);
    console.log("the res :=", response);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const responseData = await response.json();
    console.log("Server response:", responseData);
    return responseData.roomid;
  } catch (error) {
    console.error("Error sending data to server:", error);
    // Handle the error or return a default value if needed
    return null;
  }
}

// Call the async function and use the room ID if needed
async function generateRoomID(myUserID, myLocationID) {
  try {
    const roomID = await fetchRoomID(myUserID, myLocationID);
    console.log("Room ID:", roomID);
    return roomID;
    // Use the roomID for further operations if needed
  } catch (error) {
    console.error("Error:", error);
    // Handle any errors that occurred during the process
  }
}

async function clearFromMap(myUserID, myLocationID, sessionID) {
  try {
    console.log("clearMap........ sessionID", sessionID);
    const url = `http://localhost:9000/clearMap?username=${encodeURIComponent(
      myUserID
    )}&mylocation=${myLocationID}&roomid=${encodeURIComponent(sessionID)}`;

    const response = await fetch(url);
    console.log("the res :=", response);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const responseData = await response.json();
    console.log("Server response:", responseData);
  } catch (error) {
    console.error("Error sending data to server:", error);
    // Handle the error or return a default value if needed
    return null;
  }
}

function beforeunload() {
  console.log("beforeunloadddd");
  group.disconnect();
  disconnected();
}

// window.addEventListener("beforeunload", beforeunload);
// window.addEventListener("onunload", async function (event) {
//   try {
//     event.preventDefault();
//     message = "you got disconnected";

//     console.log("chat js....");

//     const url = `http://localhost:9000/ondisconnect?username=${encodeURIComponent(
//       myUserID
//     )}&message=${message}&roomid=${encodeURIComponent(sessionID)}`;

//     const response = await fetch(url);
//     console.log("the res :=", response);

//     if (!response.ok) {
//       throw new Error("Network response was not ok");
//     }
//     const responseData = await response.json();
//     console.log("Server response:", responseData);
//   } catch (error) {
//     console.error("Error sending data to server:", error);
//     // Handle the error or return a default value if needed
//     return null;
//   }
// });

// window.addEventListener("beforeunload", async function (event) {
//   try {
//     event.preventDefault();
//     message = "you got disconnected";

//     console.log("chat js....");

//     const url = `http://localhost:9000/ondisconnect?username=${encodeURIComponent(
//       myUserID
//     )}&message=${message}&roomid=${encodeURIComponent(sessionID)}`;

//     const response = await fetch(url);
//     console.log("the res :=", response);

//     if (!response.ok) {
//       throw new Error("Network response was not ok");
//     }
//     const responseData = await response.json();
//     console.log("Server response:", responseData);
//   } catch (error) {
//     console.error("Error sending data to server:", error);
//     // Handle the error or return a default value if needed
//     return null;
//   }
// });

// console.log("hhhhhh", group);
// console.log("event beforeunload..", event);

// group.disconnect();
// await clearPublicRoom(myUserID, myLocationID, someid);

async function clearPublicRoom(myUserID, myLocationID, someid) {
  if (myLocationID) {
    console.log("since it is a public room.....");
    console.log("myUser id", myUserID);
    // console.log("some id ", euserID);
    console.log("SESSION ID = ", sessionID);
    console.log("some id ", myLocationID);

    await clearFromMap(myUserID, myLocationID, someid);
    console.log("clearFROMMAP executed....");
  }
}
