// function addToCart(prodId){
//     $.ajax({
//         url:"/add-to-cart/"+prodId,
//         method:"get",
//         success:(response)=>{
//             if (response.status) {
//                 let count= $('#cart-count').html()
//                 count=parseInt(count)+1
//                 $('#cart-count').html(count)
//             }



//         }
//     })
// }

function addToCart(prodId) {
  fetch("/add-to-cart/" + prodId)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.status) {
        let count = $("#cart-count").html();
        if (count=="") {
          count="0"
        }
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
      }
      else{
        location.href="/login"
      }
    });
}
function changeQuantity(prodId, count,prodPrice) {
  let maxLimit=10;
  let minLimit=1;
  
  quantity= parseInt(document.getElementById(prodId).innerHTML)
  
  if ((quantity!=10||count!=1)&&(quantity!=1||count!=-1)) {
    
    fetch("/change-cart-count", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prodId: prodId,
        count: count,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById(prodId).innerHTML =
          parseInt(document.getElementById(prodId).innerHTML) + data;
        console.log(prodId);



      });
      currentCount=parseInt(document.getElementById(prodId).innerHTML)+count;
      document.getElementById("price-"+prodId).innerHTML=currentCount* prodPrice;
      
      
      if (currentCount==maxLimit) {
        document.getElementById("plus-btn"+prodId).disabled=true
        
      }
      else if (currentCount==minLimit) {
        document.getElementById("minus-btn"+prodId).disabled=true
      }
      
      else{
        document.getElementById("minus-btn"+prodId).disabled=false
        document.getElementById("plus-btn"+prodId).disabled=false
      }
  }
  
    
   else {
    alert('down')
    
  }
   getTotalAmount()
    
  }
  // document.getElementById("minus-btn").createAttribute("disabled")
//  document.getElementsByClassName("minus-btn").disabled=true;
// a=document.getElementsByTagName("p")[0].id
// b=document.getElementById(a).innerHTML
// console.log(a);
// console.log(b);

// if (b==10) {
//   document.getElementById("plus-btn").disabled=true
// }
// else{
//   document.getElementById("plus-btn").disabled=false
// }

function getTotalAmount() {
  var a;
  fetch("/get-total").then((res)=>res.json()).then((data)=>{
   
    document.getElementById("tot").innerHTML=data
  })
  
}
