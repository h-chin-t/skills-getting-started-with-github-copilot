document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and form dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section if any have signed up
        let participantsHTML = "";
        if (details.participants.length > 0) {
          const listItems = details.participants
            .map(
              (p) =>
                `<li>${p} <span class="remove" data-activity="${name}" data-email="${p}" title="Unregister">&times;</span></li>`
            )
            .join("");
          participantsHTML = `
            <div class="participants">
              <h5>Participants:</h5>
              <ul>${listItems}</ul>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // update UI immediately, then re-fetch to be sure
        addParticipantToCard(activity, email);
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // delegate click event to remove buttons
  activitiesList.addEventListener("click", async (e) => {
    if (!e.target.matches(".remove")) return;
    const activity = e.target.getAttribute("data-activity");
    const email = e.target.getAttribute("data-email");

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await resp.json();
      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "info";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
    } catch (err) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering:", err);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  });
  // utility to add a single participant to card (used after signup/unregister)
  function addParticipantToCard(activityName, email) {
    const cards = document.querySelectorAll(".activity-card");
    for (const card of cards) {
      const title = card.querySelector("h4").textContent;
      if (title === activityName) {
        const ul = card.querySelector("ul");
        if (ul) {
          const li = document.createElement("li");
          li.innerHTML = `${email} <span class="remove" data-activity="${activityName}" data-email="${email}" title="Unregister">&times;</span>`;
          ul.appendChild(li);
        }
        // update spots left
        const availP = card.querySelector("p:nth-of-type(3)");
        if (availP) {
          const match = availP.textContent.match(/(\d+) spots left/);
          if (match) {
            const current = parseInt(match[1], 10);
            availP.innerHTML = `<strong>Availability:</strong> ${current - 1} spots left`;
          }
        }
        break;
      }
    }
  }

  // Initialize app
  fetchActivities();
});
