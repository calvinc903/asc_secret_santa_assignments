/**
 * Secret Santa Configuration
 * Update these values annually
 */

const config = {
  // Current party year
  currentPartyYear: 2025,
  
  // Current party date
  partyDate: '2026-01-02',
  
  // Archive cutoff year (show this year and earlier in archives)
  // Archives will show years up to and including this year
  archiveYearCutoff: 2024,

  
  // Database name for current year
  get currentYearDatabase() {
    return this.currentPartyYear.toString();
  },
  
  // Get all years to include in archives (from 2024 up to cutoff)
  getArchiveYears() {
    const years = [];
    for (let year = 2024; year <= this.archiveYearCutoff; year++) {
      years.push(year.toString());
    }
    return years;
  }
};

module.exports = config;
