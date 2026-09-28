function generateRoute() {

    const button =
        document.querySelector(".route-button");

    button.innerText = "Calculating route...";

    button.disabled = true;


    setTimeout(() => {

        button.innerText =
            "✓ Route Generated";

        button.disabled = false;

    }, 1500);

}