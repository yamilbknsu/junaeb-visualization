# junaeb-visualization
## The project
This visualization was built to analyse different strategies
for delivering food that is usually supplied by school to 
students that rely on them to eat everyday. <br>
So during an emergency such as the COVID-19 pandemic, we are pushed
to find better ways of delivering this service contrained by the situation.
In this case, this means have as little contact between citizens as possible, so the disease
doesn't continue spreading.<br>
For this reason, we have built an optimization process that computes optimal routes applying different
strategies to the network graph of two of the biggest cities of southern Chile, Concepción and Chillán.<br>
The results are then animated on this platform so we can visualize the results and act accordingly.

### Estrategies
1. Strategy 1: Aggregate students to their nearest corner in the graph and find the optimal route for a delivery truck starting
at each school and passing through all students assigned to it.
1. Strategy 2: The same truck, but now the assignment is made to each student's actual school (the school they attend during normal periods of classes).
1. Strategy 3: The scenario in which the students go walking from their home to their actual school.
1. Strategy 4: The scenario in which the stundets go walking to their nearest school, assigned by minimal walking time.