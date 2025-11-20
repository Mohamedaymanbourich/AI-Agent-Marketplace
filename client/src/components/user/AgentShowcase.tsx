import { useState, useContext } from "react";
import AgentCardNew, { AgentCardProps } from "./AgentCardNew";
import { AppContext } from "../../context/AppContext";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import styles from "./AgentShowcase.module.css";
import { Link } from "react-router-dom";

const categories = [
  "All",
  "Productivity",
  "Writing",
  "Data",
  "Education",
  "Health",
  "Development",
  "Marketing",
  "Lifestyle",
];

const AgentShowcase = () => {
  const { allAgents } = useContext(AppContext);

  const [activeCategory, setActiveCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filteredAgents = allAgents.filter(
    (agent: AgentCardProps) => activeCategory === "All" || agent.category === activeCategory
  );

  const displayAgents = showAll ? filteredAgents : filteredAgents.slice(0, 6);

  return (
    <>
      {" "}
      <div className={styles.header}>
        <div id = "agent-showcase">
          <h2 className={styles.heading}>Explore AI Agents</h2>
          <p className={styles.subheading}>Find the perfect AI assistant for your needs</p>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          <Tabs defaultValue="All">
            <TabsList className={styles.tabsList}>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  onClick={() => setActiveCategory(category)}
                  className={styles.tabsTrigger}
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory}>
              <div className={styles.agentGrid}>
                {displayAgents.map((agent, index) => (
                  <AgentCardNew key={index} {...agent} />
                ))}
              </div>

              {filteredAgents.length > 6 && !showAll && (
                <div className={styles.viewMoreWrapper}>
                  <Link
                    to="/agents"
                    onClick={() => scrollTo(0, 0)}
                    className="text-gray-500 border border-gray-500/30 px-10 py-3 rounded"
                  >
                    Show all agents
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AgentShowcase;
