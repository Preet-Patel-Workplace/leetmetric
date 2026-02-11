document.addEventListener("DOMContentLoaded", () => {
  const fetchButton = document.getElementById("fetch-button");
  const usernameInput = document.getElementById("username-input");

  const easyProgressCircle = document.querySelector(".easy-progress");
  const mediumProgressCircle = document.querySelector(".medium-progress");
  const hardProgressCircle = document.querySelector(".hard-progress");

  const easyLabel = document.querySelector(".easy-label");
  const mediumLabel = document.querySelector(".medium-label");
  const hardLabel = document.querySelector(".hard-label");

  const profile = document.getElementById("profile");
  const profileName = document.getElementById("profile-name");
  const profileSub = document.getElementById("profile-sub");
  const avatar = document.getElementById("avatar");
  const pill = document.getElementById("pill");

  const totalSolvedEl = document.getElementById("total-solved");
  const acceptanceEl = document.getElementById("acceptance");

  const errorEl = document.getElementById("error");
  const skeleton = document.getElementById("skeleton");
  const content = document.getElementById("content");

  const ACCENT = "#FFA116";

  function validateUsername(username) {
    errorEl.textContent = "";
    if (!username.trim()) {
      errorEl.textContent = "Please enter a username.";
      return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      errorEl.textContent = "Username invalid. Use letters, numbers, underscores only.";
      return false;
    }
    return true;
  }

  function setLoading(isLoading) {
    fetchButton.disabled = isLoading;
    usernameInput.disabled = isLoading;

    if (isLoading) {
      fetchButton.classList.add("loading");
      fetchButton.querySelector(".btn-text").textContent = "Fetching";
      skeleton.classList.remove("hidden");
      content.classList.add("hidden");
      errorEl.textContent = "";
    } else {
      fetchButton.classList.remove("loading");
      fetchButton.querySelector(".btn-text").textContent = "Fetch";
      skeleton.classList.add("hidden");
      content.classList.remove("hidden");
    }
  }

  function updateProgress(solved, total, label, circle) {
    const safeTotal = Math.max(1, Number(total) || 0);
    const safeSolved = Math.max(0, Number(solved) || 0);
    const progress = Math.min(100, (safeSolved / safeTotal) * 100);

    circle.style.setProperty("--progress-degree", `${progress}%`);
    circle.style.background = `conic-gradient(${ACCENT} ${progress}%, rgba(255,255,255,0.12) 0%)`;
    label.textContent = `${safeSolved} / ${Number(total) || 0}`;
  }

  function calcAcceptance(acArr, totalArr) {
    // Use "All" (index 0) if present
    const ac = acArr?.[0]?.submissions ?? 0;
    const total = totalArr?.[0]?.submissions ?? 0;
    if (!total) return 0;
    return (ac / total) * 100;
  }

  function showProfile(username) {
    profile.classList.remove("hidden");
    profileName.textContent = username;
    profileSub.textContent = "LeetCode public stats";
    avatar.textContent = (username?.[0] || "L").toUpperCase();
    pill.textContent = "Updated";
  }

  async function fetchUserData(username) {
    try {
      setLoading(true);

      const proxyUrl = "https://cors-anywhere.herokuapp.com/";
      const apiUrl = "https://leetcode.com/graphql/";

      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const graphql = JSON.stringify({
        query: `
          query userSessionProgress($username: String!) {
            allQuestionsCount { difficulty count }
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum { difficulty count submissions }
                totalSubmissionNum { difficulty count submissions }
              }
            }
          }
        `,
        variables: { username }
      });

      const response = await fetch(proxyUrl + apiUrl, {
        method: "POST",
        headers,
        body: graphql,
        redirect: "follow",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      if (!data?.data?.matchedUser) {
        throw new Error("User not found");
      }

      displayUserData(username, data);
    } catch (err) {
      console.log(err);
      errorEl.textContent =
        "No data found. If this keeps happening, enable CORS Anywhere demo access or use your own proxy.";
      profile.classList.add("hidden");
    } finally {
      setLoading(false);
      usernameInput.value = "";
    }
  }

  function displayUserData(username, pdata) {
    const all = pdata.data.allQuestionsCount;

    // Usually: [All, Easy, Medium, Hard]
    const totalAll = all?.[0]?.count ?? 0;
    const totalEasy = all?.[1]?.count ?? 0;
    const totalMedium = all?.[2]?.count ?? 0;
    const totalHard = all?.[3]?.count ?? 0;

    const ac = pdata.data.matchedUser.submitStats.acSubmissionNum;
    const total = pdata.data.matchedUser.submitStats.totalSubmissionNum;

    const solvedAll = ac?.[0]?.count ?? 0;
    const solvedEasy = ac?.[1]?.count ?? 0;
    const solvedMedium = ac?.[2]?.count ?? 0;
    const solvedHard = ac?.[3]?.count ?? 0;

    updateProgress(solvedEasy, totalEasy, easyLabel, easyProgressCircle);
    updateProgress(solvedMedium, totalMedium, mediumLabel, mediumProgressCircle);
    updateProgress(solvedHard, totalHard, hardLabel, hardProgressCircle);

    totalSolvedEl.textContent = solvedAll.toLocaleString();

    const accRate = calcAcceptance(ac, total);
    acceptanceEl.textContent = `${accRate.toFixed(1)}%`;

    showProfile(username);
  }

  function handleFetch() {
    const username = usernameInput.value.trim();
    if (validateUsername(username)) fetchUserData(username);
  }

  fetchButton.addEventListener("click", handleFetch);

  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleFetch();
  });
});