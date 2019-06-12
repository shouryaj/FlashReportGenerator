import React, { Component } from "react";
import { Router } from "@reach/router"
import Nav from "./Layout/Nav";
import isEmpty from 'lodash/isEmpty'

import DatePicker from "./Components/DatePicker";
import DataTable from "./Components/DataTable";
import fetchDataForWeek from "./data-fetcher";
import ChartView from "./Components/ChartView";
import CompanyChart from "./Components/CompanyChart";

import "tachyons/css/tachyons.css";
import ExtraSelector from "./Components/ExtraSelector";
import OverLapOptions from "./Components/OverLapOptions";

const Overview = ({ locations, startDate }) => <DataTable locations={locations} startDate={startDate} />

const Trends = (props) => {
  return (
      <React.Fragment>
        <ChartView dataForWeek={props.dataForWeek} dataType={props.dataType}/>
      </React.Fragment>
  );
}

class App extends Component {
  state = {
    dataType: 'netSales', // this is default
    activeWeek: [], // 7 date objects
    weeksToGoBack: 5,
    dataForWeek: {},
    dataForWeekLastYear: {},
    allData: {},
    isLoading: false
  };

  handleSetWeek = async (activeWeek) => {
    // console.log(activeWeek); // for debugging
    this.setState({ isLoading: true, activeWeek });
    const lastYearActiveWeek = new Date(activeWeek[0]);
    await lastYearActiveWeek.setFullYear(lastYearActiveWeek.getFullYear() - 1);
    await lastYearActiveWeek.setDate(lastYearActiveWeek.getDate() + 1); // adds day so it starts on Monday
    const [dataForWeek, dataForWeekLastYear] = await Promise.all([fetchDataForWeek([activeWeek[0], this.state.weeksToGoBack]), fetchDataForWeek([lastYearActiveWeek, this.state.weeksToGoBack])]);
    if(this.state.dataType === "lastYear"){
            // we want to set the state back to net sales cause netsales is still what we want
      await this.setState({ isLoading: false, dataForWeek: dataForWeek, 
        dataForWeekLastYear: dataForWeekLastYear, dataType: "netSales", allData: [dataForWeek, dataForWeekLastYear]});
    }else{
      await this.setState({ isLoading: false, dataForWeek: dataForWeek, allData: [dataForWeek]});
    }
  };

  // TODO: add a layer of indirection here ^ V

  handleSetWeeksToGoBack = async (weeksToGoBack) => {
    // console.log(weeksToGoBack.target.value) // for debugging
    this.setState({ isLoading: true, weeksToGoBack: weeksToGoBack.target.value });
    const dataForWeek = await fetchDataForWeek([this.state.activeWeek[0], weeksToGoBack.target.value]);

    if(this.state.dataType === "lastYear"){
      const lastYearActiveWeek = new Date(this.state.activeWeek[0]);
      lastYearActiveWeek.setFullYear(lastYearActiveWeek.getFullYear() - 1);
      const dataForWeekLastYear = await fetchDataForWeek([lastYearActiveWeek, weeksToGoBack.target.value]);
      this.setState({ isLoading: false, dataForWeek: dataForWeek, 
        dataForWeekLastYear: dataForWeekLastYear, dataType: "netSales",allData: [dataForWeek, dataForWeekLastYear]});
    }else{
      this.setState({ isLoading: false, dataForWeek: dataForWeek, allData: [dataForWeek]});
    }
  };

  // Set the type of data
  handleValueChange = async (value) => {
    this.setState({dataType: value});
  }

  componentDidMount() {
    document.title = "FareStart: Flash Report";
  }

  render() {
    const { activeWeek, dataForWeek, isLoading, allData, dataType } = this.state;
    const { locations } = dataForWeek;
    const startDate = activeWeek[0];

    return (
      <div className='mw9 center bg-white pa3'>
        <div className='flex flex-row items-baseline justify-between content-center'>
          <div className='flex-0'>
            <h1>FareStart: Flash Report</h1>
          </div>
          <div className='flex-0'>
            <select
              value={this.state.weeksToGoBack}
              onChange={this.handleSetWeeksToGoBack}
            >
              <option value={5}>6 weeks</option>
              <option value={11}>12 weeks</option>
            </select>
            <DatePicker activeWeek={activeWeek} onSetWeek={this.handleSetWeek} />
            <ExtraSelector onValueChange={this.handleValueChange}/>
            <OverLapOptions flag={[this.state.budget, this.state.labor, this.state.lastYear]}
                           func={(es_budget, es_labor, es_lastYear) =>
              this.setState({budget: es_budget, labor: es_labor, lastYear: es_lastYear})}/>
          </div>
        </div>

        {isLoading ? (
          <React.Fragment>loading...</React.Fragment>
        ) : (
          !isEmpty(dataForWeek) ? (
            <React.Fragment>
              <Nav />

              <Router>
                <Overview path='/' locations={locations} startDate={startDate} />
                <Trends path='/trends' dataForWeek={allData} dataType={dataType}/>
              </Router>
            </React.Fragment>
          ) : (
            <p>Please select a date range to view the report.</p>
          )
        )}
      </div>
    );
  }
}

export default App;
