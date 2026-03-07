async function logout(){
    await api("api/auth/logout.php","POST");
    location.reload();
}