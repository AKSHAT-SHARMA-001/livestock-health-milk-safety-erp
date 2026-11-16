package com.livestock.milk.repository;

import com.livestock.milk.model.MilkRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MilkRecordRepository extends JpaRepository<MilkRecord, Long> {}
