function playerdetails() {
    var name = document.getElementById("playerform").elements[0].value;
    alert(name);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("resultsteam").innerHTML =
                this.responseText;
        }
    };
    xhttp.open("POST", "http://localhost:5000/get_player_info", true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXJuYW1lIjoiYW51cmFnIiwicGFzc3dvcmQiOiJwYXNzd29yZCJ9LCJpYXQiOjE1NjEyOTkzNzR9.oncuidSkn10OOYVQiSTYVmDd9rfRN16g6JYp5DdJ-D8');
    var data= {
        "name":name
    }
    xhttp.send(JSON.stringify(data));
    return false;
}