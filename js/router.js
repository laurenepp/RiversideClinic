function buildMenu(role){
  const menu = document.getElementById("menu");
  menu.innerHTML = "";

  if(role === "Administrator"){
    menu.innerHTML += `<button onclick="loadAdmin()">Admin Dashboard</button>`;
  }

  if(role === "Doctor"){
    menu.innerHTML += `<button onclick="loadDoctor()">My Schedule</button>`;
  }

  if(role === "Nurse"){
    menu.innerHTML += `<button onclick="loadNurse()">Nurse Station</button>`;
  }

  if(role === "Receptionist"){
    menu.innerHTML += `<button onclick="loadReception()">Front Desk</button>`;
  }
}