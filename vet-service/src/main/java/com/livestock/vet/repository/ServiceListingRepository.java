package com.livestock.vet.repository;

import com.livestock.vet.model.ServiceListing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {}
