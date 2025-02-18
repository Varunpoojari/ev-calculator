'use client';

import React from 'react';
import { Card, Title, Text, Grid, TextInput, Metric, Button, Callout, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Tab, TabGroup, TabList, TabPanel, TabPanels, Select, SelectItem } from '@tremor/react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

// Function to convert numbers to words (Indian numbering system)
function numberToWords(num: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  function convertToWords(n: number): string {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertToWords(n % 100) : '');
    if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertToWords(n % 1000) : '');
    if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertToWords(n % 100000) : '');
    return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertToWords(n % 10000000) : '');
  }
  
  return convertToWords(num);
}

export default function Home() {
  const [vehicleType, setVehicleType] = React.useState('4wheeler');
  const [costBreakdownPeriod, setCostBreakdownPeriod] = React.useState('daily');
  const [inputs, setInputs] = React.useState({
    evPrice: '',
    petrolPrice: '',
    evRange: '',
    petrolMileage: '',
    electricityRate: '',
    fuelPrice: '',
    dailyDistance: '',
  });

  const [results, setResults] = React.useState({
    evCostPerKm: 0,
    petrolCostPerKm: 0,
    yearlySavings: 0,
    breakEvenYears: 0,
    dailyCost: {
      ev: 0,
      petrol: 0
    },
    monthlyCost: {
      ev: 0,
      petrol: 0
    },
    fiveYearSavings: 0,
    co2Savings: 0 // kg of CO2 saved per year
  });

  const [activeTab, setActiveTab] = React.useState(0);

  // Update the scroll function and refs type
  const overviewRef = React.useRef<HTMLDivElement>(null);
  const detailedAnalysisRef = React.useRef<HTMLDivElement>(null);
  const environmentalImpactRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const calculateCosts = () => {
    const values = inputs;
    const {
      evPrice,
      petrolPrice,
      evRange,
      petrolMileage,
      electricityRate,
      fuelPrice,
      dailyDistance,
    } = values;

    if (
      !evPrice || !petrolPrice || !evRange || !petrolMileage ||
      !electricityRate || !fuelPrice || !dailyDistance
    ) {
      alert('Please fill in all fields to calculate');
      return;
    }

    // Validate numeric inputs
    const numericInputs = {
      evPrice: parseFloat(evPrice),
      petrolPrice: parseFloat(petrolPrice),
      evRange: parseFloat(evRange),
      petrolMileage: parseFloat(petrolMileage),
      electricityRate: parseFloat(electricityRate),
      fuelPrice: parseFloat(fuelPrice),
      dailyDistance: parseFloat(dailyDistance),
    };

    if (Object.values(numericInputs).some(isNaN)) {
      alert('Please enter valid numeric values');
      return;
    }

    // Convert all inputs to numbers
    const ev = {
      price: numericInputs.evPrice,
      range: numericInputs.evRange,
      electricityRate: numericInputs.electricityRate,
    };

    const petrol = {
      price: numericInputs.petrolPrice,
      mileage: numericInputs.petrolMileage,
      fuelPrice: numericInputs.fuelPrice,
    };

    const dailyKm = numericInputs.dailyDistance;
    const yearlyKm = dailyKm * 365;

    // Calculate cost per km (adjusted for vehicle type)
    // For 2-wheelers, we assume 40% less electricity consumption and better mileage
    const evEfficiencyFactor = vehicleType === '2wheeler' ? 0.6 : 1;
    const petrolEfficiencyFactor = vehicleType === '2wheeler' ? 1.4 : 1; // 2-wheelers have better mileage

    // Calculate EV cost per km with battery capacity factor
    const batteryCapacityKWh = ev.range * (vehicleType === '2wheeler' ? 0.1 : 0.2); // Approximate kWh based on range
    const evCostPerKm = (ev.electricityRate * batteryCapacityKWh * evEfficiencyFactor) / ev.range;
    
    // Calculate petrol cost per km with efficiency factor
    const petrolCostPerKm = petrol.fuelPrice / (petrol.mileage * petrolEfficiencyFactor);

    // Calculate yearly running cost difference
    const yearlySavings = (petrolCostPerKm - evCostPerKm) * yearlyKm;

    // Calculate break-even point in years
    const priceDifference = ev.price - petrol.price;
    const breakEvenYears = yearlySavings > 0 ? priceDifference / yearlySavings : Infinity;

    // Daily and monthly calculations
    const dailyCostEV = evCostPerKm * dailyKm;
    const dailyCostPetrol = petrolCostPerKm * dailyKm;
    const monthlyCostEV = dailyCostEV * 30;
    const monthlyCostPetrol = dailyCostPetrol * 30;
    const fiveYearSavings = yearlySavings * 5;
    
    // Adjust CO2 calculations based on vehicle type
    // 2-wheelers emit about 50% less CO2 than 4-wheelers
    const co2Factor = vehicleType === '2wheeler' ? 0.5 : 1;
    const petrolLitersPerYear = yearlyKm / (petrol.mileage * petrolEfficiencyFactor);
    const co2SavingsPerYear = Math.abs((petrolLitersPerYear * 2.3 * co2Factor) - (yearlyKm * 0.1 * evEfficiencyFactor));

    setResults({
      evCostPerKm,
      petrolCostPerKm,
      yearlySavings,
      breakEvenYears,
      dailyCost: {
        ev: dailyCostEV,
        petrol: dailyCostPetrol
      },
      monthlyCost: {
        ev: monthlyCostEV,
        petrol: monthlyCostPetrol
      },
      fiveYearSavings,
      co2Savings: co2SavingsPerYear
    });
  };

  const handleVehicleTypeChange = (newType: string) => {
    setVehicleType(newType);
    // Reset all inputs
    setInputs({
      evPrice: '',
      petrolPrice: '',
      evRange: '',
      petrolMileage: '',
      electricityRate: '',
      fuelPrice: '',
      dailyDistance: '',
    });
    // Reset results
    setResults({
      evCostPerKm: 0,
      petrolCostPerKm: 0,
      yearlySavings: 0,
      breakEvenYears: 0,
      dailyCost: { ev: 0, petrol: 0 },
      monthlyCost: { ev: 0, petrol: 0 },
      fiveYearSavings: 0,
      co2Savings: 0
    });
  };

  const handleInputChange = (name: string, value: string) => {
    const newInputs = { ...inputs, [name]: value };
    setInputs(newInputs);
  };

  const chartData = {
    labels: ['Initial', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [
      {
        label: `${vehicleType === '2wheeler' ? 'Electric Bike' : 'Electric Car'} Total Cost`,
        data: inputs.evPrice ? Array.from({ length: 6 }, (_, i) => 
          parseFloat(inputs.evPrice) + (results.evCostPerKm * parseFloat(inputs.dailyDistance || '0') * 365 * i)
        ) : [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: false,
      },
      {
        label: `${vehicleType === '2wheeler' ? 'Petrol Bike' : 'Petrol Car'} Total Cost`,
        data: inputs.petrolPrice ? Array.from({ length: 6 }, (_, i) => 
          parseFloat(inputs.petrolPrice) + (results.petrolCostPerKm * parseFloat(inputs.dailyDistance || '0') * 365 * i)
        ) : [],
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '5-Year Cost Comparison',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Cost (₹)',
          font: {
            size: 14,
            weight: 'normal' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const barData = {
    labels: ['Daily Cost', 'Monthly Cost', 'Yearly Cost'],
    datasets: [
      {
        label: 'EV Costs',
        data: [
          results.dailyCost.ev,
          results.monthlyCost.ev,
          results.evCostPerKm * parseFloat(inputs.dailyDistance || '0') * 365
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: 'Petrol Costs',
        data: [
          results.dailyCost.petrol,
          results.monthlyCost.petrol,
          results.petrolCostPerKm * parseFloat(inputs.dailyDistance || '0') * 365
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }
    ]
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Cost Comparison Breakdown',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cost (₹)',
        },
      },
    },
  };

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Title className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">EV vs Petrol Cost Calculator</Title>
          <Text className="text-gray-600 text-xl">Make an informed decision about your next vehicle purchase</Text>
        </div>

        <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-indigo-100">
          <div className="flex flex-col md:flex-row items-center gap-6 p-4">
            <div className="w-full">
              <div className="mb-4 font-semibold text-indigo-900 text-center">Select Vehicle Type</div>
              <div className="flex items-center justify-center gap-8 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl">
                <div className={`text-4xl transition-all duration-300 ${vehicleType === '2wheeler' ? 'scale-125 opacity-100' : 'scale-100 opacity-50'}`}>
                  🛵
                </div>
                <button 
                  onClick={() => handleVehicleTypeChange(vehicleType === '2wheeler' ? '4wheeler' : '2wheeler')}
                  className="relative group"
                >
                  <div className="w-20 h-10 bg-indigo-100 rounded-full p-1 cursor-pointer">
                    <div className={`w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 ${vehicleType === '2wheeler' ? 'translate-x-0' : 'translate-x-12'}`}>
                      🚶
                    </div>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Click to toggle
                  </div>
                </button>
                <div className={`text-4xl transition-all duration-300 ${vehicleType === '4wheeler' ? 'scale-125 opacity-100' : 'scale-100 opacity-50'}`}>
                  🚗
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                {vehicleType === '2wheeler' 
                  ? "Compare electric vs petrol two-wheelers. The calculator adjusts efficiency factors for bikes and scooters."
                  : "Compare electric vs petrol cars. The calculator uses standard efficiency factors for four-wheelers."}
              </div>
            </div>
          </div>
        </Card>

        <Callout
          className="mb-8 shadow-md rounded-xl border border-blue-100"
          title="💡 Smart Calculator Tips"
          color="blue"
        >
          <div className="mt-2">
            <ul className="list-disc ml-4 space-y-2 text-sm">
              <li>Include all costs like insurance, maintenance, and registration in vehicle prices</li>
              <li>Consider your actual daily commute and occasional long trips for yearly distance</li>
              <li>Check your electricity bill for accurate per unit (kWh) rates</li>
              <li>Factor in current fuel prices in your region</li>
              <li className="font-medium text-indigo-700">{vehicleType === '2wheeler' 
                ? "For two-wheelers, consider the lower maintenance costs and better maneuverability in traffic"
                : "For cars, factor in additional costs like parking and higher insurance premiums"}
              </li>
            </ul>
          </div>
        </Callout>
        
        <Grid numItems={1} numItemsSm={2} numItemsLg={2} className="gap-6 mt-8">
          <Card decoration="top" decorationColor="blue" className="shadow-md hover:shadow-xl transition-all duration-200 border border-indigo-100 rounded-xl">
            <Title>Vehicle Prices</Title>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  EV Price (₹)
                  <span className="text-gray-500 cursor-help" title="Total on-road price of the electric vehicle">(i)</span>
                </div>
                <TextInput
                  className="mt-2"
                  placeholder="Enter EV price"
                  value={inputs.evPrice}
                  onChange={(e) => handleInputChange('evPrice', e.target.value)}
                />
                {inputs.evPrice && (
                  <div className="text-xs text-gray-500 mt-1">
                    {numberToWords(parseFloat(inputs.evPrice))} Rupees
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Petrol Vehicle Price (₹)
                  <span className="text-gray-500 cursor-help" title="Total on-road price of the petrol vehicle">(i)</span>
                </div>
                <TextInput
                  className="mt-2"
                  placeholder="Enter petrol vehicle price"
                  value={inputs.petrolPrice}
                  onChange={(e) => handleInputChange('petrolPrice', e.target.value)}
                />
                {inputs.petrolPrice && (
                  <div className="text-xs text-gray-500 mt-1">
                    {numberToWords(parseFloat(inputs.petrolPrice))} Rupees
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card decoration="top" decorationColor="green" className="shadow-md hover:shadow-xl transition-all duration-200 border border-indigo-100 rounded-xl">
            <Title>Vehicle Specifications</Title>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  EV Range (km/charge)
                  <span className="text-gray-500 cursor-help" title="Distance the EV can travel on a single charge">(i)</span>
                </div>
                <TextInput
                  className="mt-2"
                  placeholder="Enter EV range"
                  value={inputs.evRange}
                  onChange={(e) => handleInputChange('evRange', e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Petrol Mileage (km/L)
                  <span className="text-gray-500 cursor-help" title="Distance the petrol vehicle can travel per liter">(i)</span>
                </div>
                <TextInput
                  className="mt-2"
                  placeholder="Enter petrol mileage"
                  value={inputs.petrolMileage}
                  onChange={(e) => handleInputChange('petrolMileage', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card decoration="top" decorationColor="orange" className="shadow-md hover:shadow-xl transition-all duration-200 border border-indigo-100 rounded-xl">
            <Title>Running Costs</Title>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  Electricity Rate (₹/kWh)
                  <span className="text-gray-500 cursor-help" title="Cost of electricity per kilowatt-hour">(i)</span>
                </div>
                <TextInput
                  className="mt-2"
                  placeholder="Enter electricity rate"
                  value={inputs.electricityRate}
                  onChange={(e) => handleInputChange('electricityRate', e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  Fuel Price (₹/L)
                  <span className="text-gray-500 cursor-help" title="Current price of petrol per liter">(i)</span>
                </div>
                <TextInput
                  className="mt-2"
                  placeholder="Enter fuel price"
                  value={inputs.fuelPrice}
                  onChange={(e) => handleInputChange('fuelPrice', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card decoration="top" decorationColor="purple" className="shadow-md hover:shadow-xl transition-all duration-200 border border-indigo-100 rounded-xl">
            <Title>Usage</Title>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                Daily Distance (km)
                <span className="text-gray-500 cursor-help" title="Average daily driving distance">(i)</span>
              </div>
              <TextInput
                className="mt-2"
                placeholder="Enter daily distance"
                value={inputs.dailyDistance}
                onChange={(e) => handleInputChange('dailyDistance', e.target.value)}
              />
              {inputs.dailyDistance && (
                <div className="text-xs text-gray-500 mt-1">
                  {numberToWords(parseFloat(inputs.dailyDistance))} Kilometers per day
                  <br />
                  (Approximately {numberToWords(parseFloat(inputs.dailyDistance) * 365)} Kilometers per year)
                </div>
              )}
            </div>
          </Card>
        </Grid>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            color="blue"
            onClick={calculateCosts}
            className="w-full md:w-auto text-lg px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg rounded-xl"
          >
            Calculate Total Costs
          </Button>
        </div>

        {(results.evCostPerKm > 0 || results.petrolCostPerKm > 0) && (
          <div className="mt-10 space-y-8">
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => {
                  setActiveTab(0);
                  scrollToSection(overviewRef);
                }}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg"
              >
                📊 Cost Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab(1);
                  scrollToSection(detailedAnalysisRef);
                }}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg"
              >
                💰 Detailed Analysis
              </button>
              <button
                onClick={() => {
                  setActiveTab(2);
                  scrollToSection(environmentalImpactRef);
                }}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg"
              >
                🌱 Environmental Impact
              </button>
            </div>

            <TabGroup index={activeTab} onIndexChange={setActiveTab}>
              <TabPanels>
                <TabPanel>
                  <div ref={overviewRef}>
                    <Card className="mt-4 shadow-lg border border-indigo-100 rounded-xl">
                      <div className="flex justify-between items-center mb-4">
                        <Title className="text-xl font-bold text-indigo-900">Cost Comparison Over Time</Title>
                      </div>
                      <div className="h-96 mt-6">
                        <Line data={chartData} options={chartOptions} />
                      </div>
                    </Card>
                  </div>
                </TabPanel>

                <TabPanel>
                  <div ref={detailedAnalysisRef}>
                    <div className="flex justify-end mb-4">
                      <div className="bg-indigo-50 p-1 rounded-lg inline-flex">
                        <button
                          onClick={() => setCostBreakdownPeriod('daily')}
                          className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center gap-2
                            ${costBreakdownPeriod === 'daily' 
                              ? 'bg-white text-indigo-600 shadow-sm' 
                              : 'text-indigo-600 hover:bg-white/50'}`}
                        >
                          📆 Daily
                        </button>
                        <button
                          onClick={() => setCostBreakdownPeriod('monthly')}
                          className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center gap-2
                            ${costBreakdownPeriod === 'monthly' 
                              ? 'bg-white text-indigo-600 shadow-sm' 
                              : 'text-indigo-600 hover:bg-white/50'}`}
                        >
                          📅 Monthly
                        </button>
                      </div>
                    </div>
                    <Grid numItems={1} numItemsSm={2} className="gap-6">
                      {costBreakdownPeriod === 'daily' ? (
                        <Card decoration="top" decorationColor="blue" className="shadow-md hover:shadow-xl transition-all duration-200 border border-indigo-100 rounded-xl">
                          <Title>Daily Cost Breakdown</Title>
                          <div className="mt-4">
                            <Grid numItems={2} className="gap-4">
                              <div className="text-blue-600 text-2xl font-semibold">₹ {results.dailyCost.ev.toFixed(2)}</div>
                              <div className="text-red-600 text-2xl font-semibold">₹ {results.dailyCost.petrol.toFixed(2)}</div>
                              <div>EV Daily Cost</div>
                              <div>Petrol Daily Cost</div>
                            </Grid>
                            <div className="text-xs text-gray-500 mt-4">
                              Daily savings with EV: ₹ {(results.dailyCost.petrol - results.dailyCost.ev).toFixed(2)}
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card decoration="top" decorationColor="green" className="shadow-md hover:shadow-xl transition-all duration-200 border border-indigo-100 rounded-xl">
                          <Title>Monthly Cost Breakdown</Title>
                          <div className="mt-4">
                            <Grid numItems={2} className="gap-4">
                              <div className="text-blue-600 text-2xl font-semibold">₹ {results.monthlyCost.ev.toFixed(2)}</div>
                              <div className="text-red-600 text-2xl font-semibold">₹ {results.monthlyCost.petrol.toFixed(2)}</div>
                              <div>EV Monthly Cost</div>
                              <div>Petrol Monthly Cost</div>
                            </Grid>
                            <div className="text-xs text-gray-500 mt-4">
                              Monthly savings with EV: ₹ {(results.monthlyCost.petrol - results.monthlyCost.ev).toFixed(2)}
                            </div>
                          </div>
                        </Card>
                      )}
                    </Grid>

                    <Card className="mt-6 shadow-lg border border-indigo-100 rounded-xl">
                      <Title>5-Year Financial Summary</Title>
                      <Table className="mt-4">
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell className="w-1/4">Category</TableHeaderCell>
                            <TableHeaderCell className="w-1/4 text-right">EV</TableHeaderCell>
                            <TableHeaderCell className="w-1/4 text-right">Petrol</TableHeaderCell>
                            <TableHeaderCell className="w-1/4 text-right">Savings</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Initial Cost</TableCell>
                            <TableCell className="text-right">₹ {parseFloat(inputs.evPrice).toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹ {parseFloat(inputs.petrolPrice).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge color={parseFloat(inputs.evPrice) > parseFloat(inputs.petrolPrice) ? "red" : "green"}>
                                ₹ {Math.abs(parseFloat(inputs.evPrice) - parseFloat(inputs.petrolPrice)).toLocaleString()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Running Cost (5 Years)</TableCell>
                            <TableCell className="text-right">₹ {(results.evCostPerKm * parseFloat(inputs.dailyDistance) * 365 * 5).toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹ {(results.petrolCostPerKm * parseFloat(inputs.dailyDistance) * 365 * 5).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge color="green">
                                ₹ {results.fiveYearSavings.toLocaleString()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow className="font-semibold">
                            <TableCell>Total Cost (5 Years)</TableCell>
                            <TableCell className="text-right">₹ {(parseFloat(inputs.evPrice) + results.evCostPerKm * parseFloat(inputs.dailyDistance) * 365 * 5).toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹ {(parseFloat(inputs.petrolPrice) + results.petrolCostPerKm * parseFloat(inputs.dailyDistance) * 365 * 5).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge color="green" size="lg">
                                ₹ {(results.fiveYearSavings - (parseFloat(inputs.evPrice) - parseFloat(inputs.petrolPrice))).toLocaleString()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </TabPanel>

                <TabPanel>
                  <div ref={environmentalImpactRef}>
                    <Card className="mt-4 shadow-lg border border-indigo-100 rounded-xl">
                      <Title>Environmental Impact of Your {vehicleType === '2wheeler' ? 'Electric Bike' : 'Electric Car'}</Title>
                      <div className="mt-4">
                        <Metric className="text-green-600">{Math.round(results.co2Savings)} kg CO2</Metric>
                        <Text>Yearly CO2 Emissions Saved</Text>
                        <Text className="text-sm text-gray-500 mt-2">
                          By choosing an {vehicleType === '2wheeler' ? 'electric bike' : 'electric car'}, you'll save approximately {Math.round(results.co2Savings)} kg of CO2 emissions per year, equivalent to planting {Math.round(results.co2Savings / 20)} trees
                        </Text>
                        
                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                          <Title className="text-green-700">Environmental Benefits of Your {vehicleType === '2wheeler' ? 'Electric Bike' : 'Electric Car'}</Title>
                          <div className="mt-2">
                            <ul className="list-disc ml-4 space-y-2 text-green-600">
                              <li>Zero direct emissions while driving, contributing to cleaner urban air</li>
                              <li>Significantly lower noise pollution compared to {vehicleType === '2wheeler' ? 'petrol bikes' : 'conventional cars'}</li>
                              <li>Reduced carbon footprint with renewable energy charging options</li>
                              <li>Support for sustainable transportation and reduced fossil fuel dependency</li>
                              <li>{vehicleType === '2wheeler' 
                                ? 'Compact size helps reduce traffic congestion and parking space requirements' 
                                : 'Modern electric cars often use recycled materials and have longer-lasting components'}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>

            <Card className="mt-6 bg-indigo-50">
              <Title className="text-indigo-900">💡 Key Insights</Title>
              <div className="mt-4 space-y-3">
                <div>
                  • Break-even Period: <span className="font-semibold">{results.breakEvenYears.toFixed(1)} years</span>
                </div>
                <div>
                  • Monthly Savings: <span className="font-semibold">₹ {(results.monthlyCost.petrol - results.monthlyCost.ev).toFixed(2)}</span>
                </div>
                <div>
                  • 5-Year Savings: <span className="font-semibold">₹ {results.fiveYearSavings.toLocaleString()}</span>
                </div>
                <div>
                  • CO2 Reduction: <span className="font-semibold">{Math.round(results.co2Savings)} kg/year</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
} 