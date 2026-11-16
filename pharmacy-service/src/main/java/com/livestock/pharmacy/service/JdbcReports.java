package com.livestock.pharmacy.service;

import java.sql.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Unit 3: plain JDBC, PreparedStatement and ResultSet; cross-schema SELECTs only for reports. */
@Component
public class JdbcReports {
  @Value("${spring.datasource.url}")
  private String url;

  @Value("${spring.datasource.username}")
  private String username;

  @Value("${spring.datasource.password}")
  private String password;

  private static final Map<String, String> SQL =
      Map.of(
          "withdrawal",
              "SELECT a.tag_number, u.name farmer, b.end_date FROM milk_db.withdrawal_blocks b JOIN"
                  + " user_animal_db.animals a ON a.id=b.animal_id JOIN"
                  + " user_animal_db.farmer_profiles f ON f.id=b.farmer_id JOIN"
                  + " user_animal_db.users u ON u.id=f.user_id WHERE CURRENT_DATE BETWEEN"
                  + " b.start_date AND b.end_date",
          "top-vets",
              "SELECT v.id,v.name,AVG(r.score) average_rating FROM vet_db.ratings r JOIN"
                  + " vet_db.bookings b ON b.id=r.booking_id JOIN vet_db.service_listings s ON"
                  + " s.id=b.listing_id JOIN vet_db.vet_profiles v ON v.id=s.vet_id GROUP BY"
                  + " v.id,v.name HAVING AVG(r.score)>(SELECT AVG(score) FROM vet_db.ratings)",
          "low-stock",
              "SELECT id,name,stock,threshold,expiry_date FROM pharmacy_db.medicines WHERE"
                  + " stock<threshold",
          "attention",
              "SELECT f.id,u.name FROM user_animal_db.farmer_profiles f JOIN user_animal_db.users u"
                  + " ON u.id=f.user_id JOIN vet_db.bookings b ON b.farmer_id=f.id WHERE"
                  + " b.status='PENDING' UNION SELECT f.id,u.name FROM"
                  + " user_animal_db.farmer_profiles f JOIN user_animal_db.users u ON"
                  + " u.id=f.user_id JOIN milk_db.withdrawal_blocks w ON w.farmer_id=f.id WHERE"
                  + " CURRENT_DATE BETWEEN w.start_date AND w.end_date",
          "unvaccinated",
              "SELECT a.id,a.tag_number FROM user_animal_db.animals a WHERE a.id IN(SELECT"
                  + " b.animal_id FROM vet_db.treatments t JOIN vet_db.bookings b ON"
                  + " b.id=t.booking_id WHERE t.status='COMPLETED') AND a.id NOT IN(SELECT"
                  + " b.animal_id FROM vet_db.vaccinations v JOIN vet_db.bookings b ON"
                  + " b.id=v.booking_id WHERE v.stock_deducted=true)",
          "treated-vaccinated",
              "SELECT a.id,a.tag_number FROM user_animal_db.animals a WHERE a.id IN(SELECT"
                  + " b.animal_id FROM vet_db.treatments t JOIN vet_db.bookings b ON"
                  + " b.id=t.booking_id WHERE t.status='COMPLETED') AND a.id IN(SELECT b.animal_id"
                  + " FROM vet_db.vaccinations v JOIN vet_db.bookings b ON b.id=v.booking_id WHERE"
                  + " v.stock_deducted=true)");

  public List<Map<String, Object>> run(String name) throws SQLException {
    String sql = SQL.get(name);
    if (sql == null) throw new IllegalArgumentException("Unknown report");
    try (Connection c = DriverManager.getConnection(url, username, password);
        PreparedStatement p = c.prepareStatement(sql);
        ResultSet r = p.executeQuery()) {
      List<Map<String, Object>> rows = new ArrayList<>();
      ResultSetMetaData md = r.getMetaData();
      while (r.next()) {
        Map<String, Object> row = new LinkedHashMap<>();
        for (int i = 1; i <= md.getColumnCount(); i++)
          row.put(md.getColumnLabel(i), r.getObject(i));
        rows.add(row);
      }
      return rows;
    }
  }
}
