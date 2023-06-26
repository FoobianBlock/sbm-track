class trainEntry {
  constructor(rake, propertiesJson)  {
    this.rake = rake;
    this.propertiesJson = propertiesJson;
  }
};

const socket = new WebSocket('wss://api.geops.io/realtime-ws/v1/?key=5cc87b12d7c5370001c1d655112ec5c21e0f441792cfc2fafe3e7a1e');

let statusText = document.getElementsByClassName("status")[0];
let trains = [];

socket.onopen = function(e) {
  statusText.innerHTML = "Connected";
  socket.send("GET trajectory");
};
  
socket.onmessage = function(event) {
  var wsContent = JSON.parse(event.data).content;
  
  if(wsContent.properties != undefined) {
    var train = new trainEntry(wsContent.properties.rake, wsContent.properties);
    drawTrain(train);
    trains[trains.length]=train;
  } else console.log(wsContent);
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

  let realtime_text;
  if(properties.has_realtime)
  {
    if (properties.has_realtime_journey)
      realtime_text = "yes with has_realtime_journey"
    else
      realtime_text = "yes without has_realtime_journey"
  }

  let eventDecode;
  if(properties.event != null)
  {
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
      case "UN":
        eventDecode = properties.event + " (Unbekannt)";
        break;
      default:
        eventDecode = properties.event;
        break;
    }
  }

  let imageContent = "";
  if(properties.rake != null)
  {
    if(properties.rake.includes("948004231833"))
    {
      imageContent = "<img src=\"img/50jahreSBM.png\" alt=\"50 Jahre S-Bahn München Logo\" style=\"float:right; margin: 15px\" class=\"logo\">"
    }
    else if(properties.rake.includes("948004232286"))
    {
      imageContent = "<img src=\"img/423286_Icon.png\" alt=\"Diversity S-Bahn\" style=\"height: 400px; float:right; margin: 10px;\" class=\"logo\">"
    }
  }

  let coordContent = "null";
  if(properties.raw_coordinates != null)
  {
    coordContent = `<a href=\"http://www.google.com/maps/place/${properties.raw_coordinates[1]},${properties.raw_coordinates[0]}\">${JSON.stringify(properties.raw_coordinates)}<a>`
  }

  let content = `<div class="trainEntryDiv" style="background-color:${lineCol}; color:${textCol}; word-wrap:anywhere; padding:10px; margin:10px;">
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
      <b>event_delay:</b> ${properties.event_delay} <br>
    </div>
  </div><br>`;

  if(properties.rake != null && (properties.rake.includes("948004231833") || properties.rake.includes("948004232286")))
    document.getElementsByClassName("results")[0].innerHTML = content + document.getElementsByClassName("results")[0].innerHTML;
  else
    document.getElementsByClassName("results")[0].innerHTML = document.getElementsByClassName("results")[0].innerHTML + content;
}

function filter() {
  var search = document.getElementsByClassName("searchBar")[0].value;
  var tenantFilter = document.getElementsByClassName("tenantFilterDropdown")[0].value;
  document.getElementsByClassName("results")[0].innerHTML = '';

  console.log(tenantFilter);

  trains.forEach(e => {
    if(e.rake != null && e.rake.includes(search)) {
      if(e.propertiesJson.tenant != null && (e.propertiesJson.tenant == tenantFilter | tenantFilter=="")) {
        drawTrain(e);
      }
    } else if(e.propertiesJson.transmitting_vehicle != null && e.propertiesJson.transmitting_vehicle.includes(search)) {
      if(e.propertiesJson.tenant != null && (e.propertiesJson.tenant == tenantFilter | tenantFilter=="")) {
        drawTrain(e);
      }
    }
  });
}