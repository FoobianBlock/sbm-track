let drawDebugStyle = true;
let socket = null;
let socketPingInterval = -1;

class trainEntry {
  constructor(rake, propertiesJson)  {
    this.rake = rake;
    this.propertiesJson = propertiesJson;
  }
};

function setupSocket() {
  if(socket != null) {
    socket.close();
  }

  socket = new WebSocket('wss://api.geops.io/realtime-ws/stag/?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e');

  socket.onopen = function(e) {
    statusText.innerHTML = "Connected";
    // Subscribes to the entire world
    socket.send("BBOX -20037508 -20048966 20037508 20048966 10");

    // Send "PING" every 10 seconds; otherwise timeout after 30 seconds
    clearInterval(socketPingInterval);
    socketPingInterval = setInterval(function() {
      socket.send("PING");
    }, 10000)
  };
    
  socket.onmessage = function(event) {
    var wsMessage = JSON.parse(event.data);
    var wsContent = wsMessage.content; 

    if (wsMessage.source == "trajectory")
    {
      if(wsContent && wsContent.properties != undefined) {
        let train = new trainEntry(wsContent.properties.rake, wsContent.properties);
        trains.set(wsContent.properties.train_id, train);
        drawTrain(train);
      }
    }
    else if (wsMessage.source == "websocket");
    else console.log(wsContent);
  };
    
  socket.onclose = function(event) {
    if (event.wasClean) {
      statusText.innerHTML = `Connection closed with code ${event.code} ${event.reason}`;
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      statusText.innerHTML = "Connection died";
      alert('[close] Connection died');
    }
  };
  
  socket.onerror = function(error) {
    statusText.innerHTML = `Error: ${error.message}`;
    alert(`[error] ${error.message}`);
  };
}

setupSocket();

let statusText = document.getElementsByClassName("status")[0];
let trains = new Map();

function forceUpdate() {
  trains.forEach((value, key) => {
    drawTrain(value);
  });
}

function updateTrainEntryStyle() {
  drawDebugStyle = document.getElementById("debugStyle").checked
  forceUpdate();
}

function drawTrain(train) {
  var properties = train.propertiesJson;

  let lineCol;
  let textCol;
  if(properties.line != null) {
    lineCol = properties.line.color;
    textCol = properties.line.text_color;
  }
  else {
    lineCol = '#000000';
    textCol = '#FFFFFF';
  }

  let eventDecode;
  switch (properties.event) {
    case "AF":
      eventDecode = properties.event + " (Abfahrt)";
      break;
    case "FA":
      eventDecode = properties.event + " (Fahrt)";
      break;
    case "AN":
      eventDecode = properties.event + " (Ankunft)";
      break;
    case "TF":
      eventDecode = properties.event + " (Türfreigabe)";
      break;
    case "SB":
      eventDecode = properties.event + " (Schließbefehl)";
      break;
    case "ZT":
      eventDecode = properties.event + " (Zugtrennung)";
      break;
    case "UN":
      eventDecode = properties.event + " (Unbekannt)";
      break;
    case undefined:
      eventDecode = "?"
      break;
    default:
      eventDecode = properties.event;
      break;
  }

  let imageContent = "";
  if(properties.rake != null)
  {
    if(properties.rake.includes("948004231833"))
    {
      imageContent = "<img src=\"img/50jahreSBM.png\" alt=\"50 Jahre S-Bahn München Logo\" style=\"float:right; margin: 15px\" class=\"logo\">"
    }
    else if(properties.rake.includes("948004232864"))
    {
      imageContent = "<img src=\"img/423286_Icon.png\" alt=\"Diversity S-Bahn\" style=\"height: 400px; float:right; margin: 10px;\" class=\"logo\">"
    }
  }

  let coordContent = "null";
  if(properties.raw_coordinates != null)
  {
    coordContent = `<a href=\"http://www.google.com/maps/place/${properties.raw_coordinates[1]},${properties.raw_coordinates[0]}\">${JSON.stringify(properties.raw_coordinates)}<a>`
  }

  let container = document.getElementById(properties.train_id);
  if(container == null) {
    container = document.createElement("div");
    container.id = properties.train_id;

    if(properties.rake == null || (properties.rake != null && (properties.rake.includes("948004231833") || properties.rake.includes("948004232864") || properties.rake.includes("948004231221") || properties.rake.includes("948004231197") || properties.rake.includes("948004232435"))))
      document.getElementsByClassName("results")[0].prepend(container);
    else
      document.getElementsByClassName("results")[0].append(container);
  }

  let content = ``;
  
  if(drawDebugStyle) {
    let realtime_text;
    if(properties.has_realtime)
    {
      if (properties.has_realtime_journey)
        realtime_text = "yes with has_realtime_journey"
      else
        realtime_text = "yes without has_realtime_journey"
    }

    content = `<div class="trainEntryDiv" id="${properties.train_id}" style="background-color:${lineCol}; color:${textCol}; display:${filter(properties.train_id) ? "" : "none"};">
    <div style="padding:0px; margin:0px;">
        ${imageContent}
        <b>rake:</b> ${properties.rake} <br>
        <b>line:</b> ${JSON.stringify(properties.line)} <br>
        <b>coordinates:</b> ${coordContent}
        <br>
        <br>
        <b>train_number:</b> ${properties.train_number} <br>
        <b>train_id:</b> ${properties.train_id} <br>
        <b>event_timestamp:</b> ${properties.event_timestamp} <br>
        <b>timestamp:</b> ${properties.timestamp} <br>
        <b>state:</b> ${properties.state} <br>
        <b>time_since_update:</b> ${properties.time_since_update} <br>
        <b>has_realtime:</b> ${realtime_text} <br>
        <b>operator_provides_realtime_journey:</b> ${properties.operator_provides_realtime_journey} <br>
        <b>has_journey:</b> ${properties.has_journey} <br>
        <b>routeIdentifier:</b> ${properties.routeIdentifier} <br>
        <b>delay:</b> ${properties.delay} <br>
        <b>raw_time:</b> ${properties.raw_time} <br>
        <b>tenant:</b> ${properties.tenant} <br>
        <b>transmitting_vehicle:</b> ${properties.transmitting_vehicle} <br>
        <b>vehicle_number:</b> ${properties.vehicle_number} <br>
        <b>original_train_number:</b> ${properties.original_train_number} <br>
        <b>original_rake:</b> ${properties.original_rake} <br>
        <b>original_line:</b> ${properties.original_line} <br>
        <b>position_correction:</b> ${properties.position_correction} <br>
        <b>event:</b> ${eventDecode} <br>
        <b>ride_state:</b> ${properties.ride_state} <br>
        <b>event_delay:</b> ${properties.event_delay} <br><br>
        <a href='https://foobianblock.github.io/ET423-webFIS/?trainid=${properties.train_id}'><i>Open in webFIS</i></a>
      </div>
    </div>`;
  }
  else {
    // lineNumberFill default colour = #008e4e
    const lineColor = properties.line == null ? "var(--color-db-cool-grey-600)" : properties.line.color;
    const lineTextColor = properties.line == null ? "white" : properties.line.text_color;
    const lineName = properties.line == null ? 
      (properties.original_line == null ? "-" : ("S" + properties.original_line)) : 
      properties.line.name;

    lineNumberSvg = `
      <svg class="lineNumber" alt="${lineName}" style="display: table-cell;" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1060 465">
        <g>
            <path id="lineNumberFill" fill="${lineColor}"
                d="M 787.5,0 H 272.173 C 143.773,0 0,104.088 0,232.488 0,360.888 143.773,464.976 272.173,464.976 H 787.5 c 128.4,0 272.174,-104.088 272.174,-232.488 C 1059.674,104.088 915.901,0 787.5,0 Z"></path>
            <text xml:space="preserve"
                style="font-style:normal;font-variant:normal;font-weight:900;font-stretch:normal;font-size:483.517px;font-family:Arial;-inkscape-font-specification:'Arial, Heavy';font-variant-ligatures:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;text-anchor:middle;dominant-baseline:middle;display:table-cell;fill:${lineTextColor};"
                x="530.66327" y="280.17865" id="lineNumberText"><tspan x="530.66327" y="280.17865">${lineName}</tspan></text>
        </g>
      </svg>`;

    tenantContent = "";
    switch (properties.tenant) {
      case "sbm":
        tenantContent =  `S-Bahn München`
        break;
      default:
        tenantContent = properties.tenant
        break;
    }

    let formationContent = "";
    if(properties.rake != null) {
      formationContent = `<div class="formationContainer">`
      
      // Ignore elements in rake with UIC "0" as they are part of a recognised multiple unit
      let ignoreZeroVehicles = false;

      properties.rake.split(";").forEach(element => {
        const trainClass = element.substring(0, 8);

        switch (trainClass) {
          case "94800423": // ET 423
            ignoreZeroVehicles = true;

            switch (element) {
              case "948004232864":
                formationContent += `
                <div style="height:100%;">
                  <img src="${properties.state == "BOARDING" ? "img/ET423_286_doorsOpen.png" : "img/ET423_286.png"}" style="height:3.33em; margin-right:-10px;">
                  <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
                </div>`;
                break;

              case "948004232435":
                formationContent += `
                <div style="height:100%;">
                  <img src="${properties.state == "BOARDING" ? "img/ET423_243_doorsOpen.png" : "img/ET423_243.png"}" style="height:3.33em; margin-right:-10px;">
                  <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
                </div>`;
                break;

              case "948004231197":
                formationContent += `
                <div style="height:100%;">
                  <img src="${properties.state == "BOARDING" ? "img/ET423_119_doorsOpen.png" : "img/ET423_119.png"}" style="height:3.33em; margin-right:-10px;">
                  <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
                </div>`;
                break;

                case "948004231221":
                  formationContent += `
                  <div style="height:100%;">
                    <img src="${properties.state == "BOARDING" ? "img/ET423_122_doorsOpen.png" : "img/ET423_122.png"}" style="height:3.33em; margin-right:-10px;">
                    <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
                  </div>`;
                  break;

              default:
                formationContent += `
                  <div style="height:100%;">
                    <img src="${properties.state == "BOARDING" ? "img/ET423_doorsOpen.png" : "img/ET423.png"}" style="height:3.33em; margin-right:-10px;">
                    <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
                  </div>`;
                  break;
            }
            break;

          case "94800420": // ET 420
            ignoreZeroVehicles = true;

            formationContent += `
              <div style="height:100%;">
                <img src="img/ET420.png" style="height:3.33em; margin-right:-8px;">
                <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
              </div>`;
            break;

          case "94800424": // ET 424
            ignoreZeroVehicles = true;

            formationContent += `
              <div style="height:100%;">
                <img src="img/ET424.png" style="height:3.33em; margin-right:-10px;">
                <p style="text-align:center; margin:0;"> ${formatUIC(element)} </p>
              </div>`;
            break;

          default: // Generic
            if(element == "0" && ignoreZeroVehicles) { break; }

            ignoreZeroVehicles = false;
            break;
        }
      });

      formationContent += `</div>`;
    }

    let openInContent = "";
    if(properties.raw_coordinates != null) {
      openInContent += `<a class="openInButton" href="http://www.google.com/maps/place/${properties.raw_coordinates[1]},${properties.raw_coordinates[0]}" target="_blank">Open in Maps</a> `;
    }
    openInContent += `<a class="openInButton" href="https://foobianblock.github.io/ET423-webFIS/?trainid=${properties.train_id}" target="_blank">Open in webFIS</a>`;

    const trainNumberContent = properties.train_number == null ? 
      `<i class="trainNumber">${properties.original_train_number}</i>` : 
      `<span class="trainNumber">${properties.train_number}</span>`;

    content = `
      <div class="trainEntryDiv" id="${properties.train_id}" style="display:${filter(properties.train_id) ? "" : "none"}; line-height: 180%;">
        <div class="openInWrapper"> 
          ${openInContent}
        </div>
        <i> ${tenantContent} </i> <br>
        <div style="display:flex; align-items:center; margin-top:8px"> ${lineNumberSvg} ${trainNumberContent} <span class="trainState"> ${properties.state} </span> <span class="trainEvent"> ${eventDecode} </span> </div>
        <b>Last updated:</b> ${new Date(properties.timestamp).toLocaleString()} <br>
        ${formationContent}
      </div>`;
  }

  container.outerHTML = content;
}

function filter(id) {
  var search = document.getElementsByClassName("searchBar")[0].value;
  var tenantFilter = document.getElementsByClassName("tenantFilterDropdown")[0].value;

  const e = trains.get(id);

  if(e.rake != null && (e.rake === null | e.rake.includes(search))) {
    if(e.propertiesJson.tenant != null && (e.propertiesJson.tenant == tenantFilter | tenantFilter=="")) {
      return true;
    }
  } else if(search === "") {
    if(e.propertiesJson.tenant != null && (e.propertiesJson.tenant == tenantFilter | tenantFilter=="")) {
      return true;
    }
  }

  return false;
}

function formatUIC(uic) {  
  uic = uic.insert_at(11, "-");
  uic = uic.insert_at(8, " ");
  uic = uic.insert_at(5, " ");
  uic = uic.insert_at(4, " ");
  return uic;
}

String.prototype.insert_at=function(index, string)
{   
  return this.substring(0, index) + string + this.substring(index);
}

updateTrainEntryStyle();