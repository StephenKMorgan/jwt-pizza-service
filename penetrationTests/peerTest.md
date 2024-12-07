# Penetration Testing: JWT Pizza
**Team:** James Finlinson, Stephen Morgan

## Self-Attack Report
**Tester:** James Finlinson

### Finding 1
| Item | Details |
|------|---------|
| Date |  |
| Target |  |
| Classification |  |
| Severity |  |
| Description |  |
| Images |  |
| Corrections |  |

### Finding 2  
| Item | Details |
|------|---------|
| Date |  |
| Target | |
| Classification |  |
| Severity |  |
| Description |  |
| Images |   |
| Corrections |  |

**Tester:** Stephen Morgan  

### Finding 1
| Item | Details |
|------|---------|
| Date | 12/5/2024 |
| Target | https://pizza.kepelcomputing.com/menu |
| Classification | Injection |
| Severity | 3 |
| Description | SQL injection deleted the menu |
| Images | <div align="left"><img src="https://lh3.googleusercontent.com/fife/ALs6j_HOnoBRwmCvHqouAeGb3p4ynvu0nC9Rorqvy9HHfVzAvcW3MhBUymc1vpwgKO5DK2XgrkZdB0IktsEn9Uc6qxXeGsZMWohPYs_Po-h9LJH6YaRY3_hrngbHC6vzRZ56IPKWmzQb-Jfuslk2aU5lb3aNdwel4GctKQmkxGaGsff_h-hCRqIhXfW8_2cYPVbSGcQoTKfHNIXM6P3FABdMvSBlcjDkF7fIZkjg9VfzM4-mCbodlpvQCnRJNapKykEhABtfGqbPhfuncjyI6uhbssqxKCgXHeUv85rI-zavuvGpJ1oyu_PSdz744CXDRUXBpySGvdozcgzXAGcZGay_CcKfybRpQTvD-hoKf_gOHmpzXW0KX9yBoHzKNY45K0pbOSxohT0cKSm3QK95wed5JRcmLtVe49tFRisHvB9u0s9czJ9gSH1_4rzNX8N0Zkv5PBNT9J0pJsDZZHihfzZZtDHwzbbV3QUvaEpBtuprPXuWbJwDNl6LdLmGEvMFNb1wX9ai4dhtlifq0wiYqKWIhE5qdkGgnnK5_bq7nYW4zxq8pNgO5taDWud0jkGnJsB4sbBDK6p-T7Q_XWUkKCubn_RoL5uKeQf-nyk6TTsMS4vgtBwDTq_X9G6CDlbORXuHtmcX3TKGvRGfg4T36ZtiT6W-UqxQYCzHkCAQnMbJ84tjuRwMbP5ee5JYBhXplF_sA_BTIIxBvfDEHaBfL2cN670ywmsMY7xy-9EouTGphH7Zm6I-iSmGqnmr7aRk_dQmYG_0wN5zRx3dQAWvnCwrUpJ27ChFOnobBHasakxD1j_eCe2xEd7vyjXH4ZsAFr0wPXgDYwqCXBAXXfufAIE99exP1f6iBNN81P_FVoYrHrB2ayruQCH2raP7l74IV7wMhT4dq3ocGxMiHdCMB0iqgAOFTixXJ9k56paWny_dS5LfGw_Sgww1oii6epgndPyQMJb02kBHv1W4QOvT9lY-oOux77v2WdRbBMOfkqxiYP5dvjXtlDi_G9mPIICtuzz0hkG1X0s4nY2mvQYbgQhRQF6IAeBTS0RBM4RqBbWSt8SANC09v6y7awCYp2ACLUeeJcfQ9g4luLBPw22H0K4O20lBZUl2Ro_FTvmPEqy2mVgiZzF3YLaf2ST9F5jenpRrd8wsSZNLkjPyQR5uGd6AEDnaaC0wizr5pZvWDY2Ob1SMQGdZHm3Dk8p4oY76T_uj4t_j2IXsA5QzCG-7mWkdqnLINTi146nGwfi2m7Huxnx4fXMozjxwlJ_Csaz1qP9AC4YGy9WQ8HOzbD-FRTPvffNjH39EZp0SiPstSAqMc6TY8hQM5Ujpy2ncwAoBljltJBb7wfmlASXpcYaO_xtWt8heksAxxvKMqtxXj00dIeM4GeuyC76wYGRXeJQhudUT7pqLmDiC1tnQvrd5O-dAMMbKKNStTzlet3zNOn5ICsTySQGH77UsbyYDGgUwI9p-xZT_MvgWHAqcefX7n8_L6YTt6vdsqAe1bnWM1P9CNp-86L67s9sVVTbYoET3EOW7s-Paz6hm4VJZablcxeJHynsl7FIyJb7g87nciKuN5bBR4pWjMRuT4H8vPco9XsElEeYMIo8-vb6x8xavw8Pm561lmu1I_So8O87O93704tWD-JMcK-EbskB5npIoK86W_qkNTCMUOsEgd3DTZhaJcWRirgf1XqY2ryrKvtAawkLt9Xp6GSa60BzGKve-ybjBKGLmqycq3wwtfgZzpJxXm1w_N5whFf8=s220?authuser=0"><br><em>Menu no longer available</em></div> |
| Corrections | Added sanitization to Database.js to avoid injection attacks |

### Finding 2  
| Item | Details |
|------|---------|
| Date | 12/5/2024 |
| Target | https://pizza.kepelcomputing.com/delivery |
| Classification | Server side request forgery |
| Severity | 10 |
| Description | Server-side request forgery allowed the user to modify the order request and change the price |
| Images | <div align="left"><img src="https://lh3.googleusercontent.com/fife/ALs6j_HopdVNtao3w5U37TGIzA2nf0hkT4lU5pbXN35HxyDzghLOC_7uuWj-lZ3bZ0WV1qJUwtqbrm6la1cYY9V4AX1-rYqesUDqYSMIb5Ld6WMSKzosulb8wDptPZnqUzNcSbmjoyDzu5w61r9un0gebciZKJDdOs2huqU5V2KaCJ4a0wWX71kXsLy73vJLnPDX1WIZpIdS53QkZyrM0JB3ZMqPaA0sJfs61bZE8YJITDzs-VXt_KWn8SEXvMru0gzIZ1I6m4aY9qMJkuKFy_YzOiO9opsJgbTrS63w6_mrlCqysUcsQAz3H-ltJ8xOBXF81Q5SdYodwlvCGokXOde5bXddYzCfetrzrt2Iu1Ef6AQ3gcY8d3AsFbd_qd1TWctS_kqPvmrhsXugyXTV7XW48gI3qLEDi63vllqzritrevZu9Y0sn1SN9zo1Kp0sh0DVYSxF1dA9KMQGQAROPuHS7wQ2aWhbJJ3wdjvLy-AX6968rlAv4ygM6I_zb3w8Fkvi0sXJsXNl3Q0xNhrz8fljQDzGNtVjjoAA7w_yEAlzh1ndOsCORBSxYXazFRYDVvMmSP-428ne6SfXK7EHv8-UovrZRAbh6Iy12Indo1I_qL1UeTDX8GR8_yTtTDtN08wug02tSfmerWUn5ucDpaIp05aFSB15qzn-XR4ixH8HNeecqh2Lqd8TvNlFbsGq_NVfBU3C2JMXSXOfqmjWD1Z43mYm5PpSN_zEyAQML6jc4FK20R_wK6pD6kFvZHC8Ii0DP8QkYSf8P862_dnYycRxOPZyXV_z19xm-Mb7cz5HUyPRQfQ-MoF7CgMkxk80ETvNXjDMMLfV0WqaSRTstWqMuWUp4GzyQBeK_kcknvS9tHGIkgkbhQC6hiu3XM_wVoUT7P5GWlKYI5sIprM9XKS6MAFfNmQ9xao53WQjz9-1YvlxCNrhFehIhGjrjF7sMGiLV7KVWKwLv11yoINPL6AehmnYQ8asSLfht9UIuDPE-Y7Rx7Vs2C-WC6uPr6MxY05vzgwxgfd-OI5JY1KF_q4WritqRNteMICKhhvg5VvvPKaSWmqS2_6pWoHCpxRpxCuUoMqUCvb6qI9NUndzLPDqqZUPTuRFuuea99MkAonBb9-rCwjEQZh6enziXOjBp_2G1XnN69L1tQ2MEf0w0YMp5EAE-9SfV6udtvAhcWSuUN-pvhW4l8KUfDteZ07QcknZShi-6xN2jCS3fa_bhb5IwAiyffBOBwZxEDzz10FFTakCIN2XbU5jJlQQHAy0FHWdRwfyOT-8_iDYqjtHYQ62lINa0sBBodLXVn2w1lLVap-E3b8GAr7iFDU1ns43YQ_0Uuvo4WXYKxWHSLfOou96hZn61m6vzqTKSsA_VcXiLnPZM-4zesLyhmMI4F_7p_Yqpfu9n4oAg-T5Jghi5bHICktzqpbDxyFiTRA2GoQQxo0sXy_Fngv6gb4ktoWtqZZtfRbGbYorpB4b8a-bQZpz-BYeE7gx5Y-JfUzUUbnYBSzaZtGcizzEDoaH7lK9PyBuwsthwbyzRsBOImGckAVGCW7hxRDOLEnRsRtxC746jwh_3bTma_at9n8kuI8uJIVazQrS6DEm8qDB2U3ccFEwfxAEwzhIqQ3u0WwOy5XDwnpZzoxPxiqi0bd5d0GzYolFcwQP8z_dJQcFlGFMsxwI-ua27rLfl7hY_jWG2k28gZijVbHafq4JWhjdWHBVHF8YuTQfjTZsVpPuw0oabHc5g8jElDzl1jo=s220?authuser=0"><br><em>The price is larger and negative</em></div> |
| Corrections | Added server-side validation of orders in orderRouter.js |

## Security Testing Reports

### Report 1: Pizza Wheat Harvest Security Assessment

**Target:** https://pizza.wheatharvest.llc  
**Date:** 12/6/2024  
**Tester:** Stephen Morgan  
**Tools Used:** Burp Suite

### Executive Summary
Security assessment was performed on the pizza ordering application. No critical vulnerabilities were identified during testing.

### Test Methodology & Results

#### 1. SQL Injection Testing
- **Approach:** Attempted SQL injection via input fields
- **Result:** No vulnerabilities detected
- **Status:** SECURE

#### 2. SSRF Testing
- **Approach:** Attempted server-side request forgery
- **Result:** No vulnerabilities detected
- **Status:** SECURE

#### 3. Access Control Testing
- **Approach:** Analyzed for broken access control patterns
- **Result:** No vulnerabilities detected
- **Status:** SECURE

#### 4. Cryptographic Implementation
- **Approach:** Analyzed responses for cryptographic weaknesses
- **Result:** No obvious cryptographic failures detected
- **Status:** SECURE

#### 5. Load Testing/DoS
- **Approach:** Attempted large volume of orders
- **Result:** System showed error under load
- **Note:** Error originated from pizza factory backend, not the application
- **Status:** PARTIAL CONCERN - Consider implementing rate limiting

### Recommendations
1. Consider implementing order volume limits
2. Add rate limiting for order submissions
3. Continue monitoring for potential DoS vulnerabilities

### Conclusion
The application shows good security implementation across tested vectors. The only notable finding was related to order volume handling, which is a backend service concern rather than an application security issue.

---

### Report 2: Pizza Kepel Computing Security Assessment

**Target:** https://pizza.kepelcomputing.com  
**Date:** 12/5/2024  
**Tester:** James Finlinson  
**Tools Used:** Burp Suite

### Executive Summary

### Test Methodology & Results

### Recommendations

### Conclusion


## Combined summary of learnings

Through our cross-team penetration testing efforts, we identified several key vulnerabilities in JWT Pizza deployments, including SQL injection vulnerabilities that could compromise menu data and server-side request forgery that allowed order price manipulation. While some systems showed robust security measures against common attack vectors, others revealed the need for enhanced input sanitization and server-side validation. The testing exercise highlighted the importance of implementing proper input validation, rate limiting for order submissions, and regular security audits. These findings led to immediate improvements in our codebase, including enhanced Database.js sanitization and strengthened orderRouter.js validation, ultimately resulting in more secure pizza ordering systems across all deployments.