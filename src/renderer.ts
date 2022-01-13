const logToLoggerDiv = (text: string) => {
  const element = document.getElementById("log");
  if (element) {
    const log = document.createElement("div");
    log.innerText = text;
    element.appendChild(log);
  }
};

const logToBar = (text: string) => {
  const element = document.getElementById("bar");
  if (element) {
    element.innerText = text;
  }
};

window.api.receive("log", (data: string) => {
  logToLoggerDiv(data);
});

window.api.receive("bar", (data: string) => {
  logToBar(data);
});

function sendCommand(command: "minimize" | "minimize-to-tray" | "exit") {
  window.api.send("command", command);
}

document.getElementById("minimize-to-tray-button").onclick = () =>
  sendCommand("minimize-to-tray");
document.getElementById("minimize-button").onclick = () =>
  sendCommand("minimize");
document.getElementById("exit-button").onclick = () => sendCommand("exit");
