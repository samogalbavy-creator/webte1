/*hamburger menu*/
const navToggle = document.querySelector(".nav__toggle");
const navList = document.querySelector("nav ul");

if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
        navList.classList.toggle("nav__list--open");
    });
}

/*start and end of semester*/
const SEMESTER_START = new Date("2026-09-14T00:00:00");
const SEMESTER_END = new Date("2027-02-13T23:59:59");

/*map functionality only runnable on map.html*/
const mapElement = document.getElementById("map");

if (mapElement && typeof L !== "undefined") {

    /*permanent map locations*/
    const SCHOOL = {
        name: "FEI STU",
        lat: 48.151965,
        lng: 17.072995
    };

    const HOME = {
        name: "Domov",
        lat: 48.2049,
        lng: 17.2066
    };

    /*leaflet map*/
    const map = L.map("map").setView(
        [48.15, 17.10],
        13
    );

    /*openstreetmap tiles*/
    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    ).addTo(map);

    /*markers for school,home*/
    const schoolMarker = L.marker([
        SCHOOL.lat,
        SCHOOL.lng
    ])
        .addTo(map)
        .bindPopup(SCHOOL.name);


    const homeMarker = L.marker([
        HOME.lat,
        HOME.lng
    ])
        .addTo(map)
        .bindPopup(HOME.name);

    /*elements from map.html*/
    const emptyState = document.getElementById("empty-state");
    const pointsList = document.getElementById("points-list");
    const pointSelect = document.getElementById("point-select");
    const targetSelect = document.getElementById("target-select");
    const calculateButton = document.getElementById("calculate-distance");
    const distanceResult = document.getElementById("distance-result");

   /*saved custom points*/
   let customPoints = [];

    try {
        const savedPoints = localStorage.getItem("customMapPoints");

    if (savedPoints) {
        const parsedPoints = JSON.parse(savedPoints);

        if (!Array.isArray(parsedPoints)) {
            throw new Error("Invalid saved points format");
        }

        customPoints = parsedPoints;
    }
    
    }catch {
    customPoints = [];

    distanceResult.textContent =
        "Uložené body sa nepodarilo načítať. " +
        "Nové body môžete pridať kliknutím na mapu.";
    }

    /*custom leaflet markers and data*/
    const customMarkers = [];
    let connectionLine = null;

    /*save custom points to LocalStorage*/
    function savePoints() {
        localStorage.setItem(
            "customMapPoints",
            JSON.stringify(customPoints)
        );
    }

    /*create leaflet marker for custom point*/
    function createMarker(point, index) {

        const marker = L.marker([
            point.lat,
            point.lng
        ])
            .addTo(map)
            .bindPopup(point.name);

        marker.on("click", function () {
            pointSelect.value = index;
        });

        customMarkers.push(marker);
    }

    /*render custom points*/
    function renderPoints() {

        pointsList.innerHTML = "";

        pointSelect.innerHTML =
            '<option value="">Vyberte bod</option>';


        if (customPoints.length === 0) {

            emptyState.style.display = "block";
            calculateButton.disabled = true;

            return;
        }


        emptyState.style.display = "none";
        calculateButton.disabled = false;

        /*restore saved markers after page reload*/
        customPoints.forEach(function (point, index) {

            const listItem = document.createElement("li");

            const button = document.createElement("button");

            button.type = "button";
            button.textContent = point.name;

            button.addEventListener("click", function () {

                pointSelect.value = index;

                customMarkers[index].openPopup();

                map.setView(
                    [point.lat, point.lng],
                    15
                );
            });


            listItem.appendChild(button);

            pointsList.appendChild(listItem);


            const option = document.createElement("option");

            option.value = index;
            option.textContent = point.name;

            pointSelect.appendChild(option);
        });
    }


   

    customPoints.forEach(function (point, index) {
        createMarker(point, index);
    });

    renderPoints();


    
    /*new point by clicking on map*/
    map.on("click", function (event) {

        const pointName = prompt(
            "Zadajte názov nového bodu:"
        );


        if (
            pointName === null ||
            pointName.trim() === ""
        ) {
            return;
        }


        const newPoint = {
            name: pointName.trim(),
            lat: event.latlng.lat,
            lng: event.latlng.lng
        };


        customPoints.push(newPoint);

        const newIndex = customPoints.length - 1;

        createMarker(newPoint, newIndex);

        savePoints();

        renderPoints();

        pointSelect.value = newIndex;

        customMarkers[newIndex].openPopup();
    });

    /*haversine formula to calculate distance*/
    function calculateDistance(
        lat1,
        lng1,
        lat2,
        lng2
    ) {

        const earthRadius = 6371;

        const latDifference =
            degreesToRadians(lat2 - lat1);

        const lngDifference =
            degreesToRadians(lng2 - lng1);


        const a =
            Math.sin(latDifference / 2) *
            Math.sin(latDifference / 2) +

            Math.cos(degreesToRadians(lat1)) *
            Math.cos(degreesToRadians(lat2)) *

            Math.sin(lngDifference / 2) *
            Math.sin(lngDifference / 2);


        const c =
            2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );


        return earthRadius * c;
    }


    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }


    /*calculate distance button*/
    calculateButton.addEventListener(
        "click",
        function () {

            const selectedIndex = pointSelect.value;


            if (selectedIndex === "") {

                distanceResult.textContent =
                    "Najskôr vyberte bod.";

                return;
            }


            const selectedPoint =
                customPoints[selectedIndex];


            let target;


            if (targetSelect.value === "school") {
                target = SCHOOL;
            } else {
                target = HOME;
            }


            const distance = calculateDistance(
                selectedPoint.lat,
                selectedPoint.lng,
                target.lat,
                target.lng
            );


            distanceResult.textContent =
                "Vzdialenosť medzi bodom „" +
                selectedPoint.name +
                "“ a cieľom „" +
                target.name +
                "“ je " +
                distance.toFixed(2) +
                " km.";
            
            /*remove previous connection line*/
            if (connectionLine) {
                map.removeLayer(connectionLine);
            }
            
            /*new connection line*/
            connectionLine = L.polyline([
                [
                    selectedPoint.lat,
                    selectedPoint.lng
                ],
                [
                    target.lat,
                    target.lng
                ]
            ]).addTo(map);
            
            /*adjust view to show both connected spots on the map*/
            map.fitBounds(
                connectionLine.getBounds(),
                {
                    padding: [40, 40]
                }
            );


            customMarkers[selectedIndex]
                .bindPopup(
                    selectedPoint.name +
                    "<br>Vzdialenosť: " +
                    distance.toFixed(2) +
                    " km"
                )
                .openPopup();


            if (targetSelect.value === "school") {

                schoolMarker.bindPopup(
                    SCHOOL.name +
                    "<br>Vzdialenosť: " +
                    distance.toFixed(2) +
                    " km"
                );

            } else {

                homeMarker.bindPopup(
                    HOME.name +
                    "<br>Vzdialenosť: " +
                    distance.toFixed(2) +
                    " km"
                );
            }
        }
    );
}

/*runnable only on schedule.html*/
const scheduleTable = document.querySelector(".schedule");

/*get elements*/
if (scheduleTable) {

    const lessons = Array.from(
        document.querySelectorAll(".schedule__lesson")
    );

    const filterButtons = document.querySelectorAll(
        ".schedule__filter"
    );

    const filterMessage = document.getElementById(
        "schedule-filter-message"
    );

    const scheduleStatus = document.getElementById(
        "schedule-status"
    );

    const semesterProgress = document.getElementById(
        "semester-progress"
    );

    const semesterProgressText = document.getElementById(
        "semester-progress-text"
    );

    /*filter by exercise or lecture*/
    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedFilter = button.dataset.filter;


            filterButtons.forEach(function (filterButton) {
                filterButton.classList.remove(
                    "schedule__filter--active"
                );
            });


            button.classList.add(
                "schedule__filter--active"
            );


            let visibleLessonCount = 0;


            lessons.forEach(function (lesson) {

                const lessonType = lesson.dataset.type;

                const shouldShow =
                    selectedFilter === "all" ||
                    lessonType === selectedFilter;


                if (shouldShow) {

                    lesson.classList.remove(
                        "schedule__lesson--hidden"
                    );

                    visibleLessonCount++;

                } else {

                    lesson.classList.add(
                        "schedule__lesson--hidden"
                    );
                }
            });

            /*show message instead of empty schedule*/
            const noResults = visibleLessonCount === 0;
            filterMessage.hidden = !noResults;
            scheduleTable.closest(".schedule__table-wrapper").hidden = noResults; 
        });
    });

    /*convert to minutes*/
    function timeToMinutes(time) {

        const parts = time.split(":");

        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        return hours * 60 + minutes;
    }

    /*weekday number*/
    function getLessonDay(lesson) {

        const row = lesson.closest("tr");

        return Number(row.dataset.day);
    }

    /*name of lesson*/
    function getLessonName(lesson) {

        const nameElement =
            lesson.querySelector("strong");

        return nameElement.textContent.trim();
    }


    function updateScheduleStatus() {

        const now = new Date();

        const currentDay = now.getDay();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();


        lessons.forEach(function (lesson) {
            lesson.classList.remove(
                "schedule__lesson--current"
            );
        });

        /*lesson in progress*/
        const currentLesson = lessons.find(
            function (lesson) {

                const lessonDay =
                    getLessonDay(lesson);

                const start =
                    timeToMinutes(
                        lesson.dataset.start
                    );

                const end =
                    timeToMinutes(
                        lesson.dataset.end
                    );


                return (
                    lessonDay === currentDay &&
                    currentMinutes >= start &&
                    currentMinutes <= end
                );
            }
        );

        /*display current lesson*/
        if (currentLesson) {

            currentLesson.classList.add(
                "schedule__lesson--current"
            );


            scheduleStatus.textContent =
                "Práve prebieha: " +
                getLessonName(currentLesson) +
                " (" +
                currentLesson.dataset.start +
                " – " +
                currentLesson.dataset.end +
                ").";

            return;
        }

        /*how far is each lesson from current time*/
        let nearestLesson = null;
        let nearestDifference = Infinity;


        lessons.forEach(function (lesson) {

            const lessonDay =
                getLessonDay(lesson);

            const startMinutes =
                timeToMinutes(
                    lesson.dataset.start
                );


            let dayDifference =
                lessonDay - currentDay;


            if (
                dayDifference < 0 ||
                (
                    dayDifference === 0 &&
                    startMinutes <= currentMinutes
                )
            ) {
                dayDifference += 7;
            }


            const difference =
                dayDifference * 24 * 60 +
                startMinutes -
                currentMinutes;


            if (difference < nearestDifference) {

                nearestDifference = difference;
                nearestLesson = lesson;
            }
        });


        if (nearestLesson) {

            const dayNames = {
                1: "pondelok",
                2: "utorok",
                3: "stredu",
                4: "štvrtok",
                5: "piatok"
            };


            const lessonDay =
                getLessonDay(nearestLesson);


            scheduleStatus.textContent =
                "Momentálne neprebieha žiadna výučba. " +
                "Najbližšia hodina je v/vo " +
                dayNames[lessonDay] +
                " o " +
                nearestLesson.dataset.start +
                " -  " +
                getLessonName(nearestLesson) +
                ".";
        }
    }

    /*semester progress*/
    function updateSemesterProgress() {

        const now = new Date();

        const semesterLength =
            SEMESTER_END - SEMESTER_START;

        const elapsedTime =
            now - SEMESTER_START;


        let percentage =
            (elapsedTime / semesterLength) * 100;


        if (percentage < 0) {
            percentage = 0;
        }

        if (percentage > 100) {
            percentage = 100;
        }


        percentage = Math.round(percentage);


        semesterProgress.value = percentage;

        semesterProgress.textContent =
            percentage + " %";


        semesterProgressText.textContent =
            "Uplynulo " +
            percentage +
            " % semestra.";
    }

    updateScheduleStatus();
    updateSemesterProgress();


    setInterval(
        updateScheduleStatus,
        60000
    );
}