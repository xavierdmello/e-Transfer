import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import React from "react";
import { ref, update, set, onValue, get } from "firebase/database";
import Header from "./components/Header.tsx";
import LandingPage from "./components/LandingPage.tsx";
import Wallet from "./components/Wallet.tsx";

import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  Box,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
} from "@chakra-ui/react";

function App() {
  const { login, authenticated, user, ready, logout, createWallet } = usePrivy();
  const [menu, setMenu] = useState("landing");
  const ref = React.useRef(null);

  return (
    <Flex justifyContent={"center"} pt={["0", "10px"]} pb={["0", "10px"]} height={"100vh"} direction={"column"} backgroundColor={["brand", "#13482e"]}>
      <Center height={"100%"}>
        <Flex
          w={["100%", "60%"]}
          maxW={"500px"}
          shadow={"sm"}
          border={"5px solid"}
          borderColor={"brand"}
          borderRadius={["0", "3xl"]}
          height={"100%"}
          borderBottomRadius={["3xl", "0xl"]}
          padding={"0px"}
          backgroundColor={"brand"}
          overflow={"hidden"}
          direction={"column"}
        >
          <Flex className="baller" height={"100%"} direction={"column"}>
            <Header setMenu={setMenu} menu={menu} />

            {menu === "landing" ? <LandingPage /> : <Wallet />}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  );
}

export default App;
