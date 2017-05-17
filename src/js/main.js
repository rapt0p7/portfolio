var hamburger = document.querySelector(".hamburger");
var menu = document.querySelector(".menu");

hamburger.addEventListener("click", function(event) {
	event.preventDefault();
	hamburger.classList.toggle("hamburger--open");
	menu.classList.toggle("menu--open");
});


$('form#contact_form').validate({
  messages: { },
  submitHandler: function(form) {
	form.submit();
  }
});
