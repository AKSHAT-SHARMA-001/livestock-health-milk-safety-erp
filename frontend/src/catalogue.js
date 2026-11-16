// Keep integration-test fixtures out of the default farmer catalogue, without deleting them.
export const isTestListing = (listing) => listing.title === "Smoke Checkup";
export const publicListings = (listings) =>
  listings.filter((listing) => !isTestListing(listing));
