package com.livestock.vet.repository;

import com.livestock.vet.model.VetProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VetProfileRepository extends JpaRepository<VetProfile, Long> {}
