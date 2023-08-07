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

// var publicCheck;
var confirmationAction;
// var intermediateGroup;
// var sessionsTillNow = [];
const imageFileExtensions = /\.(bmp|apng|gif|ico|jpg|jpeg|png|svg|webp)$/;
const youTubeURL = /^http(s)?:\/\/www.youtube.com\/watch\?v=([^&]+)(&(.*))?$/;
const slideShareURL =
  /http(s)?:\/\/www.slideshare.net\/([\w-]+\/[\w-]+)((\/?$)|\?)/;

var joinRequests = [];
// var sessions = [];

function processJoinRequest() {
  console.log("in join request");
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
  console.log("in accept");
  var userID = joinRequests.shift();
  group.acceptUser(userID);
  processJoinRequest();
});

$("#reject-join").on("click", function (event) {
  console.log("in reject");
  var userID = joinRequests.shift();
  group.rejectUser(userID);
  processJoinRequest();
});

function disconnected() {
  console.log("disconnected function");
  connected = false;
  sessionBadge.css("visibility", "hidden");
  connectButton.html("Connect");
  connectButton.addClass("btn-primary");
  connectButton.removeClass("btn-secondary");
  $(".login-detail").slideDown({ easing: "linear", duration: 2000 });
  userList.children(":not([value=everyone])").remove();
}

connectButton.on("click", async function (event) {
  alertArea.html("");

  if (connected) {
    event.preventDefault();
    console.log("if we click on disconnect");
    console.log("event", event);
    // await clearFromMap(myUserID, myLocationID, sessionID);
    group.disconnect();
    // await clearFromMap(myUserID, myLocationID, sessionID);
    console.log("hahhahhahhah==========", myUserID);
    console.log("hahhahhahhah==========", myLocationID);
    console.log("hahhahhahhah==========", sessionID);
    disconnected();

    // await clearFromMap(myUserID, myLocationID, sessionID)
    await clearFromMap(myUserID, myLocationID, sessionID);

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

      connected = true;
      $(".login-detail").slideUp();
      connectButton.html("Disconnect");
      console.log("inside connectButton.on if(connected) IS FALSE ....");
      connectButton.addClass("btn-secondary");
      connectButton.removeClass("btn-primary");

      myUserID = $("#user-id").val();
      myLocationID = $("#location-id").val();
      console.log("my userID ============", myUserID);

      console.log("myyyyyyyyy", myLocationID);

      myUserID = myUserID.replace(/\s{2,}/g, " ").replace(/\s$/, "");

      let room = await generateRoomID(myUserID, myLocationID);
      //   var sessionID = $("#session-id").val();

      // let something = await fetch(
      //   `http://localhost:9000/getRoom?username=${encodeURIComponent(
      //     myUserID
      //   )}&mylocation=${myLocationID}`
      // )
      //   .then((response) => {
      //     console.log("the res :=", response);
      //     if (!response.ok) {
      //       throw new Error("Network response was not ok");
      //     }
      //     return response.json();
      //   })
      //   .then((responseData) => {
      //     // Handle the response data from the server if needed
      //     console.log("Server response:", responseData);
      //     return responseData.roomid;
      //   })
      //   .catch((error) => {
      //     console.error("Error sending data to server:", error);
      //   });

      console.log("ssoooo the room =", room);

      sessionID = room;
      if (sessionID === "") {
        sessionID = undefined;
      }
      //   myLocationInput = $("#location-id").val();
      //   publicCheck = $("#public-id").val();
      //   console.log("myyyyyyyy loccccccccc=========", myLocationInput);
      //   console.log("myyyyyyyy public check =========", publicCheck);
      console.log("sessionID = " + sessionID);
      console.log("myUserID = " + myUserID);
      //   group.connect(sessionID, myUserID);
      //   if (!publicCheck) {
      group.connect(sessionID, myUserID);
      myUserID = escapeHTML(myUserID);
      console.log("what is a group : ", group);
      console.log("again myUserID: ", myUserID);
      //   }
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
      group.rejectUser(userToBan);
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

  group.addEventListener("connected", function (event) {
    console.log("group eventListener connected : ", group);
    console.log("group eventListener connected event: ", event);
    alertArea.append(`
			<div class="alert alert-info" id="pending-join-alert">
				Connected to ${event.sessionID}. Waiting for permission to join the conversation&hellip;
			</div>
		`);
  });

  group.addEventListener("joined", function (event) {
    console.log("joined event : ", event);
    console.log("timestamp in joined event : ", event.messageTime);
    if (event.totalUsers.length == 1) {
      roomEntity[event.sessionID] = event.totalUsers;
    }
    console.log("room entity in joined event =", roomEntity);

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
      $("#ban-user-btn").show();
    }
  });

  group.addEventListener("ejected", function (event) {
    console.log("disconnected event", event);
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
  // 		group.rejectUser(userID);
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
    console.log("userpresent event listener event", event);
    // totalUsers: (function () {
    //   var connectedUserIDs = Array.from(me.userIDs);
    //   return connectedUserIDs;
    // })(),

    console.log(
      `total connected user ids in ${event.sessionID} = `,
      event.totalUsers
    );

    roomEntity[event.sessionID] = event.totalUsers;

    console.log("the roomEntity =", roomEntity);

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

  group.addEventListener("userleft", async function (event) {
    // await clearFromMap(myUserID, myLocationID, sessionID);
    console.log("user left event : ", event);
    console.log(event.isAdmin);
    var userID = event.userID;
    console.log(
      `total connected users in ${event.sessionID} is =`,
      event.totalUsers
    );
    roomEntity[event.sessionID] = event.totalUsers;
    console.log("room Entity after user left", roomEntity);
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
        group.send(textToSend);
      } else {
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

// someFunction();
