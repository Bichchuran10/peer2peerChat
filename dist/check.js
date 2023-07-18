function f() {
  setTimeout(() => {
    console.log("helllooooo after 5 sec");
    for (let i = 0; i < 5; i++) {
      console.log(i);
    }
  }, 10000);
}

f();
// setTimeout(() => {
//   console.log("helllooooo after 5 sec");
//   for (let i=0; i<5; i++){
//     console.log(i);
//   }
// }, 5000);
