
# 📥 Eterny 2.0 – User Input Specifications

This document defines all static, recurring, and inferred input parameters that the Eterny assistant requires to optimize a user's wellness, schedule, and longevity plan.

---

## 🧍 A. Static Inputs (One-time or Infrequent Setup)

| Category               | Field / Description |
|------------------------|---------------------|
| **Profile**            | Name, Email, Gender, Date of Birth, Timezone |
| **Anthropometrics**    | Height (cm), Weight (kg), BMI, Body Fat %, Muscle %, BMR |
| **Lifestyle Patterns** | Typical wake/sleep time, Work hours, Travel frequency |
| **Chronotype**         | Morning, Night, Biphasic |
| **Medical History**    | Diagnosed conditions, Family history, Ongoing medications |
| **Supplements**        | Regular stack, dosages, intake times |
| **Spirituality / Philosophy** | Meditation habits, fasting practices, tech/lifestyle boundaries |
| **Dietary Preferences**| Vegetarian, Vegan, Keto, Mediterranean, Intermittent Fasting, dislikes |
| **Allergies / Sensitivities**| Gluten, Lactose, Nuts, etc. |
| **Wellness Goals**     | Longevity, Muscle gain, Cognitive clarity, Fat loss |
| **Baseline Wellness Requirements** | Minimum per week: Exercise, Meditation, Social engagement, Sleep targets |

---

## 🔁 B. Recurring Inputs (Daily or Weekly)

| Type                   | Field / Description |
|------------------------|---------------------|
| **Planned Schedule**   | Activity blocks (start/end time, type, tags) |
| **Actual Schedule**    | What was actually done, changes made |
| **Mood & Energy**      | Mood scale, Energy level, Stress scale, Focus rating |
| **Food Intake**        | Meal logging (time, type, quality, optionally macros) |
| **Hydration**          | Quantity and type of fluids (e.g., water, lemon water) |
| **Supplements Taken**  | Timestamped intake check-ins |
| **Sleep**              | Duration, bedtime, wake time, quality rating |
| **Physical Activity**  | Steps, Workouts, Stretching, Yoga, duration |
| **To-Do Items**        | Tasks planned and completed |
| **Symptoms**           | Headaches, bloating, fatigue, etc. |
| **Mindfulness Logs**   | Meditation, Prayer, Breathwork – type + duration |
| **Notes / Reflections**| Free-form journaling or mood tagging |

---

## 🧬 C. Biomarkers & Lab History

| Panel / Area           | Parameters Tracked |
|------------------------|--------------------|
| **Blood Tests**        | CBC, CRP, HbA1c, Fasting Glucose, Vitamin D, B12 |
| **Lipid Profile**      | HDL, LDL, Triglycerides, Total Cholesterol |
| **Hormonal Panels**    | Cortisol, Testosterone/Estrogen, TSH, FT3/FT4 |
| **Metabolic Markers**  | Insulin, HOMA-IR, Liver Enzymes |
| **Inflammation Markers** | CRP, ESR |
| **Upload Options**     | Manual entry, CSV/PDF upload (future), Lab sync |
| **History Handling**   | Maintain time series of all markers for trend analysis |

---

## 🧠 D. Learned / Inferred Inputs (AI-derived)

| Inferred From           | What is Learned |
|-------------------------|-----------------|
| Schedule vs Logging     | Adherence levels, reliability of blocks |
| Mood vs Behavior        | Correlations between actions and mental/emotional state |
| Biomarker History       | Which habits influence blood metrics |
| Energy Mapping          | Chronotype-based activity success (e.g., best focus hours) |
| Preference Drift        | Gradual shifts in user behavior patterns |
| Hidden Constraints      | E.g., late-night work causes poor sleep next day |

---

## 💾 Data Model Considerations

- Each input is stored with a userId foreign key.
- Time-based inputs support multiple timestamps per day.
- Inputs are versioned or historically stored where relevant (e.g., biomarker trends, mood logs).
- All inputs optionally include metadata such as method of collection (manual, inferred, synced).

---

## 🔐 Privacy Considerations

- Inputs marked as **sensitive** (medical, biometrics, mood) must be encrypted at rest.
- All inputs respect user-controlled data deletion and export APIs.
