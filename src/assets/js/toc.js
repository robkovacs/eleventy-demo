const setCurrentFromHash = () => {
    let tocLinks = document.querySelectorAll(".toc a");
    let currentLink = document.querySelector(".toc a.current");

    if (currentLink) {
        currentLink.classList.remove("current");
    }

    let foundNewCurrent = false;

    tocLinks.forEach((el) => { 
        if (window.location.hash == el.getAttribute("href")) {
            el.classList.add("current");
            foundNewCurrent = true;
            // document.querySelector(el.getAttribute('href')).scrollIntoView();       
        }
    });

    if (!foundNewCurrent) {
        tocLinks.forEach((el) => {
            let ancestor = document.getElementById(el.getAttribute("href").slice(1)).parentNode;
            let target = document.getElementById(window.location.hash.slice(1));
            
            if (ancestor.contains(target)) {
                el.classList.add("current");
            }
        });       
    }
};

window.addEventListener("hashchange", setCurrentFromHash);

window.addEventListener("load", setCurrentFromHash);

document.querySelectorAll(".toc a").forEach((link) => {
    link.addEventListener("click", setCurrentFromHash);
});

const updateTOC = (entry) => {
    const targetId = entry.target.firstElementChild.getAttribute("id");
    const currentLink = document.querySelector(".toc a.current");
    if (entry.isIntersecting) {
        if (currentLink) {
            currentLink.classList.remove("current");
        }
        document
            .querySelector('.toc a[href="#' + targetId + '"]')
            .classList.add("current");
        window.history.replaceState(null, null, "#" + targetId);
        // TODO: don't replace state if the existing hash is a child of this
    }
};

const observer = new IntersectionObserver(
    (entries) => { entries.forEach(updateTOC); },
    {
        rootMargin: "0px 0px -75% 0px",
        threshold: 0,
    },
);

const lastObserver = new IntersectionObserver(
    (entries) => { entries.forEach(updateTOC); },
    { threshold: 1 },
);

document.querySelectorAll("section:has(.toc__heading)").forEach((section) => {
    observer.observe(section);

    if (section === section.parentNode.lastElementChild) {
        console.log("last section is: ", section);
        lastObserver.observe(section);
    }
});
