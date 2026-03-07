async function api(url, method="GET", data=null){
    let opts = {method, headers:{'Content-Type':'application/json'}};
    if(data) opts.body = JSON.stringify(data);

    let res = await fetch(url, opts);
    if(!res.ok) throw await res.json();
    return res.json();
}