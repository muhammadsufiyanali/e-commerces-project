const navbar = document.getElementById("links");
const menubtn = document.getElementById("menu-btn");

menubtn.addEventListener("click", () => {
    navbar.classList.toggle("active");
});

let add = document.querySelector(".add");
const phone =document.querySelector(".phone")
const laptop =document.querySelector(".laptop")
const watch =document.querySelector(".watch")
const headphone =document.querySelector(".headphone")

let product_container;

let data = JSON.parse(localStorage.getItem("product"))

for(i = 0; i < data.length; i++){
    let product_container = document.createElement("div")
    add.appendChild(product_container)
    product_container.innerHTML =`
    <img src="${data[i].img_url}">
    <p>Name:${data[i].Product_name}</p>`
}

let category_1 = "phone";
phone.addEventListener("click",()=>{
   let ifphone = data.filter(ele => ele.category == category_1);
   add.innerHTML = "";
   for (let i = 0; i < ifphone.length; i++) {
      let phone_div = document.createElement("div");
      add.appendChild(phone_div);
      phone_div.innerHTML = `
      <img src = "${ifphone[i].img_url}">
      <p>Name:${ifphone[i].Product_name}</p>
      `
   }
})
let category_2 = "laptop";
laptop.addEventListener("click",()=>{
   let iflaptop = data.filter(ele => ele.category == category_2);
   add.innerHTML = "";
   for (let i = 0; i < iflaptop.length; i++) {
      let laptop_div = document.createElement("div");
      add.appendChild(laptop_div);
      laptop_div.innerHTML = `
      <img src = "${iflaptop[i].img_url}">
      <p>Name:${iflaptop[i].Product_name}</p>
      `
   }
})
let category_3 = "watch";
watch.addEventListener("click",()=>{
   let ifwatch = data.filter(ele => ele.category == category_3);
   add.innerHTML = "";
   for (let i = 0; i < ifwatch.length; i++) {
      let watch_div = document.createElement("div");
      add.appendChild(watch_div);
      watch_div.innerHTML = `
      <img src = "${ifwatch[i].img_url}" width = 200px>
      <p>Name:${ifwatch[i].Product_name}</p>
      `
   }
})
let category_4 = "headphone";
headphone.addEventListener("click",()=>{
   let ifheadphone = data.filter(ele => ele.category == category_4);
   add.innerHTML = "";
   for (let i = 0; i < ifheadphone.length; i++) {
      let headphone_div = document.createElement("div");
      add.appendChild(headphone_div);
      headphone_div.innerHTML = `
      <img src = "${ifheadphone[i].img_url}" >
      <p>Name:${ifheadphone[i].Product_name}</p>
      `
   }
})




